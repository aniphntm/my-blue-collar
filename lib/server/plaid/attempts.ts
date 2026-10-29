import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { BankOnboardingStatus, BankOnboardingView } from "@/lib/bank-onboarding";
import { requestFingerprint } from "@/lib/applications";

type Supabase = ReturnType<typeof createAdminClient>;

export const ATTEMPT_COOKIE = "bw_bank_attempt";
const ATTEMPT_TTL_MS = 30 * 60 * 1000;
const ATTEMPTS_PER_HOUR = 5;

export type AttemptEvent =
  | "attempt_created" | "link_token_issued" | "exchange_started" | "account_ineligible"
  | "ownership_verified" | "ownership_needs_review" | "ownership_rejected" | "provider_error";

export type Attempt = {
  id: string;
  plaid_client_user_id: string;
  status: BankOnboardingStatus;
  status_reason: string | null;
  environment: "sandbox" | "production";
};

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

// CSRF defense for cookie-authenticated mutations, on top of the SameSite=Strict cookie.
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

export type RateLimit = { ok: true; fingerprint: string | null } | { ok: false; status: 429 | 503 };

// Fails closed in production when no fingerprint secret exists, so the endpoint cannot be hammered unlimited.
export async function checkRateLimit(supabase: Supabase, request: Request): Promise<RateLimit> {
  const fingerprint = requestFingerprint(request);
  if (!fingerprint) return process.env.NODE_ENV === "production" ? { ok: false, status: 503 } : { ok: true, fingerprint: null };
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase.from("bank_onboarding_attempts").select("id", { count: "exact", head: true })
    .eq("request_fingerprint", fingerprint).gte("created_at", since);
  return (count ?? 0) >= ATTEMPTS_PER_HOUR ? { ok: false, status: 429 } : { ok: true, fingerprint };
}

export async function createAttempt(supabase: Supabase, environment: Attempt["environment"], fingerprint: string | null) {
  const id = randomUUID();
  const secret = randomBytes(32).toString("base64url");
  const clientUserId = `bw_${randomBytes(24).toString("base64url")}`;
  const { error } = await supabase.from("bank_onboarding_attempts").insert({
    id,
    environment,
    plaid_client_user_id: clientUserId,
    secret_hash: sha256(secret),
    request_fingerprint: fingerprint,
    expires_at: new Date(Date.now() + ATTEMPT_TTL_MS).toISOString(),
  });
  if (error) return null;
  await recordEvent(supabase, id, "attempt_created");
  return { id, secret, clientUserId };
}

export async function setAttemptCookie(attemptId: string, secret: string) {
  (await cookies()).set({
    name: ATTEMPT_COOKIE,
    value: `${attemptId}.${secret}`,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/plaid",
    maxAge: ATTEMPT_TTL_MS / 1000,
  });
}

// Resolves the attempt owned by this browser, or null when the cookie is missing, wrong, or the attempt expired.
export async function readAttempt(supabase: Supabase): Promise<Attempt | null> {
  const [id, secret] = ((await cookies()).get(ATTEMPT_COOKIE)?.value ?? "").split(".");
  if (!id || !secret || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await supabase.from("bank_onboarding_attempts")
    .select("id, plaid_client_user_id, status, status_reason, environment, secret_hash, expires_at").eq("id", id).maybeSingle();
  if (!data) return null;
  const expected = Buffer.from(data.secret_hash, "hex");
  const actual = Buffer.from(sha256(secret), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  if (Date.parse(data.expires_at) < Date.now()) return null;
  return {
    id: data.id, plaid_client_user_id: data.plaid_client_user_id, status: data.status,
    status_reason: data.status_reason, environment: data.environment,
  };
}

export async function recordEvent(supabase: Supabase, attemptId: string, event: AttemptEvent, reason?: string) {
  await supabase.from("bank_onboarding_events").insert({ attempt_id: attemptId, event, reason: reason ?? null });
}

// Compare-and-set so a replayed or concurrent request cannot move an attempt twice.
export async function transition(
  supabase: Supabase, attemptId: string, from: BankOnboardingStatus, to: BankOnboardingStatus, reason?: string,
) {
  const { data } = await supabase.from("bank_onboarding_attempts")
    .update({ status: to, status_reason: reason ?? null, updated_at: new Date().toISOString() })
    .eq("id", attemptId).eq("status", from).select("id").maybeSingle();
  return Boolean(data);
}

export async function viewFor(supabase: Supabase, attempt: Attempt): Promise<BankOnboardingView> {
  const view: BankOnboardingView = { status: attempt.status, ...(attempt.status_reason ? { reason: attempt.status_reason } : {}) };
  if (attempt.status !== "verified" && attempt.status !== "needs_review") return view;
  const { data } = await supabase.from("bank_connections")
    .select("institution_name, account_name, account_mask").eq("attempt_id", attempt.id).maybeSingle();
  return data
    ? { ...view, bank: { institutionName: data.institution_name, accountName: data.account_name, mask: data.account_mask } }
    : view;
}
