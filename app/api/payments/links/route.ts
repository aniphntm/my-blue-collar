import { guarded, json, operator } from "@/lib/payments/server";
import { paymentInput, RailError } from "@/lib/payments/config";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return guarded(async () => {
    const { stripe, account, accountId, userId, live } = await operator(request);
    const { amountMinor, description, key } = paymentInput(await request.json(), request.headers.get("idempotency-key"));
    if (!account.charges_enabled || !account.payouts_enabled || account.capabilities?.card_payments !== "active") throw new RailError(409, "Complete Stripe onboarding and enable payments and payouts first.");
    if (account.country !== "US" || account.default_currency !== "usd") throw new RailError(409, "This pilot supports US operators settling USD.");
    const ach = process.env.STRIPE_ACH_ENABLED === "true";
    if (ach && account.capabilities?.us_bank_account_ach_payments !== "active") throw new RailError(409, "ACH is not active for this operator.");
    const options = { stripeAccount: accountId };
    const prefix = `myblue:${userId}:${key}`;
    const product = await stripe.products.create({ name: description }, { ...options, idempotencyKey: `${prefix}:product` });
    const price = await stripe.prices.create({ currency: "usd", unit_amount: amountMinor, product: product.id }, { ...options, idempotencyKey: `${prefix}:price` });
    const link = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      payment_method_types: ach ? ["card", "us_bank_account"] : ["card"],
      metadata: { myblue_operator: userId, myblue_request: key },
      payment_intent_data: { metadata: { myblue_operator: userId, myblue_request: key } },
    }, { ...options, idempotencyKey: `${prefix}:link` });
    // Payment Links are reusable. Each customer visit can create a new payment.
    return json({ id: link.id, url: link.url, live, reusable: true }, 201);
  });
}
