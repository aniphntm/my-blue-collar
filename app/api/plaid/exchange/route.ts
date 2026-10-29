import type { PlaidApi } from "plaid";
import { createAdminClient } from "@/lib/supabase/admin";
import { LEGAL_NAME_MAX, LEGAL_NAME_MIN } from "@/lib/bank-onboarding";
import { seal } from "@/lib/server/crypto/secret-box";
import { plaidClient, plaidErrorCode } from "@/lib/server/plaid/client";
import { eligibleSubtype, decideOwnership, type OwnershipEvidence } from "@/lib/server/plaid/ownership";
import { isSameOrigin, readAttempt, recordEvent, transition, viewFor } from "@/lib/server/plaid/attempts";

export const runtime = "nodejs";

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request." }, { status: 403 });

  const client = plaidClient();
  let supabase;
  try { supabase = createAdminClient(); } catch { supabase = null; }
  if (!client || !supabase) return Response.json({ error: "Bank sign-in is not configured yet." }, { status: 503 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { body = {}; }
  if (!body || typeof body !== "object") body = {};
  const publicToken = text(body.publicToken, 200);
  const accountId = text(body.accountId, 128);
  const legalName = text(body.legalName, LEGAL_NAME_MAX);
  if (!publicToken.startsWith("public-") || !accountId || legalName.length < LEGAL_NAME_MIN) {
    return Response.json({ error: "Missing bank details." }, { status: 400 });
  }

  const attempt = await readAttempt(supabase);
  if (!attempt) return Response.json({ error: "Your bank sign-in expired. Please start again." }, { status: 401 });
  // A replay returns the settled outcome instead of exchanging again.
  if (attempt.status !== "created") {
    return Response.json(await viewFor(supabase, attempt), { status: attempt.status === "exchanging" ? 409 : 200 });
  }
  if (!(await transition(supabase, attempt.id, "created", "exchanging"))) {
    return Response.json({ error: "This bank sign-in is already in progress." }, { status: 409 });
  }
  await recordEvent(supabase, attempt.id, "exchange_started");

  // Provider work happens here and only returns an outcome; settling below runs once, outside the try,
  // so a late failure can never remove an item that was already stored as verified.
  let accessToken: string | null = null;
  let outcome: { to: "verified" | "needs_review" | "rejected" | "failed"; reason: string };
  try {
    const exchanged = await client.itemPublicTokenExchange({ public_token: publicToken });
    accessToken = exchanged.data.access_token;
    const itemId = exchanged.data.item_id;

    // Never trust the client's account choice: it must be an eligible account on the item we just created.
    const accounts = await client.accountsGet({ access_token: accessToken });
    const account = accounts.data.accounts.find((candidate) => candidate.account_id === accountId);
    const subtype = account ? eligibleSubtype(account.type, account.subtype) : null;
    if (!account || !subtype) {
      await recordEvent(supabase, attempt.id, "account_ineligible");
      await removeItem(client, accessToken);
      outcome = { to: "rejected", reason: "ineligible_account" };
    } else {
      const decision = decideOwnership(await ownershipEvidence(client, accessToken, accountId, legalName));
      if (decision.outcome === "rejected") {
        await recordEvent(supabase, attempt.id, "ownership_rejected", decision.reason);
        await removeItem(client, accessToken);
        outcome = { to: "rejected", reason: decision.reason };
      } else {
        const { error } = await supabase.from("bank_connections").insert({
          attempt_id: attempt.id,
          environment: attempt.environment,
          plaid_item_id: itemId,
          plaid_account_id: account.account_id,
          institution_name: accounts.data.item.institution_name ?? null,
          account_name: account.name.slice(0, 120),
          account_mask: account.mask,
          account_subtype: subtype,
          ownership_status: decision.outcome,
          ownership_name_score: decision.nameScore === null ? null : Math.round(decision.nameScore),
          access_token_ciphertext: seal(accessToken, `plaid-access-token:${attempt.environment}:${itemId}`),
        });
        if (error) throw new Error("connection insert failed");
        await recordEvent(supabase, attempt.id, decision.outcome === "verified" ? "ownership_verified" : "ownership_needs_review", decision.reason);
        outcome = { to: decision.outcome, reason: decision.reason };
      }
    }
  } catch (error) {
    console.error("plaid exchange failed", plaidErrorCode(error));
    // Do not leave a linked Item behind that we hold no record of.
    if (accessToken) await removeItem(client, accessToken);
    await recordEvent(supabase, attempt.id, "provider_error", "exchange_failed");
    outcome = { to: "failed", reason: "exchange_failed" };
  }

  await transition(supabase, attempt.id, "exchanging", outcome.to, outcome.reason);
  const view = await viewFor(supabase, { ...attempt, status: outcome.to, status_reason: outcome.reason });
  return Response.json(view, { status: outcome.to === "failed" ? 502 : 200 });
}

// Identity Match can be unavailable for an institution or product; that yields null, which is never a pass.
async function ownershipEvidence(client: PlaidApi, accessToken: string, accountId: string, legalName: string): Promise<OwnershipEvidence | null> {
  try {
    const match = await client.identityMatch({ access_token: accessToken, user: { legal_name: legalName }, options: { account_ids: [accountId] } });
    const scored = match.data.accounts.find((candidate) => candidate.account_id === accountId);
    if (!scored) return null;
    return {
      nameScore: scored.legal_name?.score ?? null,
      businessNameDetected: scored.legal_name?.is_business_name_detected ?? null,
      holderCategory: scored.holder_category ?? null,
    };
  } catch (error) {
    console.error("plaid identity match failed", plaidErrorCode(error));
    return null;
  }
}

async function removeItem(client: PlaidApi, accessToken: string) {
  try { await client.itemRemove({ access_token: accessToken }); } catch (error) {
    console.error("plaid item remove failed", plaidErrorCode(error));
  }
}
