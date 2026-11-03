import { guarded, json, operator } from "@/lib/payments/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return guarded(async () => {
    const { stripe, account, accountId, live } = await operator(request);
    const options = { stripeAccount: accountId };
    const [balance, payouts] = await Promise.all([
      stripe.balance.retrieve({}, options), stripe.payouts.list({ limit: 20 }, options),
    ]);
    return json({
      live, chargesEnabled: account.charges_enabled, payoutsEnabled: account.payouts_enabled,
      requirements: account.requirements?.currently_due ?? [],
      available: balance.available.map(({ amount, currency }) => ({ amountMinor: amount, currency })),
      pending: balance.pending.map(({ amount, currency }) => ({ amountMinor: amount, currency })),
      payoutSchedule: account.settings?.payouts?.schedule ?? null,
      payouts: payouts.data.map(p => ({ id: p.id, amountMinor: p.amount, currency: p.currency, status: p.status, arrivalDate: p.arrival_date, failureCode: p.failure_code })),
      hasMorePayouts: payouts.has_more,
    });
  });
}
