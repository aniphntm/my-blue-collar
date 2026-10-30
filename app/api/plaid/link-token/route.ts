import { CountryCode } from "plaid";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSecretBoxConfigured } from "@/lib/server/crypto/secret-box";
import { LINK_OPTIONAL_PRODUCTS, LINK_PRODUCTS, PLAID_ENVIRONMENT, plaidClient, plaidErrorCode } from "@/lib/server/plaid/client";
import { checkRateLimit, createAttempt, isSameOrigin, recordEvent, setAttemptCookie, transition } from "@/lib/server/plaid/attempts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request." }, { status: 403 });

  const client = plaidClient();
  let supabase;
  try { supabase = createAdminClient(); } catch { supabase = null; }
  if (!client || !supabase || !isSecretBoxConfigured()) {
    return Response.json({ error: "Bank sign-in is not configured yet." }, { status: 503 });
  }

  const limit = await checkRateLimit(supabase, request);
  if (!limit.ok) {
    return Response.json({ error: limit.status === 429 ? "Please try again later." : "Bank sign-in is not configured yet." }, { status: limit.status });
  }

  const created = await createAttempt(supabase, PLAID_ENVIRONMENT, limit.fingerprint);
  if (!created) return Response.json({ error: "Plaid Sandbox could not start a bank sign-in." }, { status: 500 });

  // Each attempt gets its own opaque Plaid user id; the old shared test id is gone.
  try {
    const response = await client.linkTokenCreate({
      user: { client_user_id: created.clientUserId },
      client_name: "Bluework Test Wallet",
      products: LINK_PRODUCTS,
      optional_products: LINK_OPTIONAL_PRODUCTS,
      country_codes: [CountryCode.Us],
      language: "en",
    });
    await recordEvent(supabase, created.id, "link_token_issued");
    await setAttemptCookie(created.id, created.secret);
    return Response.json({ linkToken: response.data.link_token });
  } catch (error) {
    console.error("plaid link token failed", plaidErrorCode(error));
    await recordEvent(supabase, created.id, "provider_error", "link_token_failed");
    await transition(supabase, created.id, "created", "failed", "link_token_failed");
    return Response.json({ error: "Plaid Sandbox could not start a bank sign-in." }, { status: 502 });
  }
}
