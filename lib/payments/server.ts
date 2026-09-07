import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { accountForUser, RailError, stripeMode } from "./config";

export function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
}

export async function guarded(action: () => Promise<Response>) {
  try { return await action(); }
  catch (error) {
    if (error instanceof RailError) return json({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return json({ error: "Invalid JSON." }, 400);
    // Provider payloads may contain banking information or credentials.
    return json({ error: "Payment provider request failed. Retry with the same idempotency key." }, 502);
  }
}

export async function authenticatedUser(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (\S+)$/)?.[1];
  if (!token) throw new RailError(401, "Sign in to continue.");
  const { data, error } = await createAdminClient().auth.getUser(token);
  if (error || !data.user || data.user.is_anonymous) throw new RailError(401, "Sign in to continue.");
  return data.user.id;
}

export async function operator(request: Request) {
  const userId = await authenticatedUser(request);
  const { key, live } = stripeMode();
  const accountId = accountForUser(userId, live);
  const stripe = new Stripe(key, { maxNetworkRetries: 2, timeout: 15000 });
  const account = await stripe.accounts.retrieve(accountId);
  return { stripe, account, accountId, userId, live };
}

// Receipt journal only. Never translate a webhook directly into spendable funds.
// Balances and payouts are read from Stripe; Ethereum funds require finality.
export async function recordReceipt(receipt: {
  provider: "stripe" | "alchemy"; event_id: string; scope: string;
  event_type: string; object_id: string | null; live: boolean;
}) {
  const { error } = await createAdminClient().from("payment_event_receipts").insert(receipt);
  if (error && error.code !== "23505") throw new RailError(503, "Could not persist event. Retry delivery.");
}
