export class RailError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function stripeMode() {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (!/^(sk|rk)_(test|live)_/.test(key)) throw new RailError(503, "Stripe is not configured.");
  const live = /^(sk|rk)_live_/.test(key);
  if (live && process.env.PAYMENTS_LIVE_ENABLED !== "true") throw new RailError(503, "Live payments are disabled.");
  return { key, live };
}

// Initial pilot: provision verified Connect accounts in Stripe, then bind each to
// an authenticated operator here. Never accept account IDs from request bodies.
export function accountForUser(userId: string, live: boolean): string {
  let map: Record<string, unknown>;
  try { map = JSON.parse(process.env.STRIPE_OPERATOR_ACCOUNTS ?? "{}"); }
  catch { throw new RailError(503, "Operator configuration is invalid."); }
  if (!map || typeof map !== "object" || Array.isArray(map)) throw new RailError(503, "Operator configuration is invalid.");
  const entries = map[live ? "live" : "test"];
  if (!entries || typeof entries !== "object" || Array.isArray(entries)) throw new RailError(403, "Operator payments are not enabled.");
  const accounts = entries as Record<string, unknown>;
  const account = Object.hasOwn(accounts, userId) ? accounts[userId] : undefined;
  if (typeof account !== "string" || !/^acct_[a-zA-Z0-9]+$/.test(account)) throw new RailError(403, "Operator payments are not enabled.");
  if (Object.values(accounts).filter(value => value === account).length !== 1) throw new RailError(503, "Operator account must have one owner.");
  return account;
}

export function paymentInput(body: unknown, key: string | null) {
  if (!key || !/^[a-zA-Z0-9_-]{16,80}$/.test(key)) throw new RailError(400, "Provide a unique Idempotency-Key of 16–80 letters, numbers, underscores or hyphens.");
  if (!body || typeof body !== "object") throw new RailError(400, "Invalid payment request.");
  const { amountMinor, description } = body as Record<string, unknown>;
  if (typeof amountMinor !== "number" || !Number.isSafeInteger(amountMinor) || amountMinor < 50 || amountMinor > 99999999) throw new RailError(400, "USD amount must be integer cents between 50 and 99999999.");
  if (typeof description !== "string" || !description.trim() || description.length > 200) throw new RailError(400, "Description must contain 1–200 characters.");
  return { amountMinor, description: description.trim(), key };
}
