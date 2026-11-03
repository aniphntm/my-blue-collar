import assert from "node:assert/strict";
import { test } from "node:test";
import Stripe from "stripe";
import { accountForUser, paymentInput, stripeMode } from "../lib/payments/config";
import { POST as createLink } from "../app/api/payments/links/route";
import { GET as paymentStatus } from "../app/api/payments/status/route";
import { GET as treasuryBalance } from "../app/api/treasury/balance/route";
import { POST as stripeWebhook } from "../app/api/webhooks/stripe/route";

test("live keys fail closed and remain separate from test configuration", () => {
  const before = { ...process.env };
  try {
    process.env.STRIPE_SECRET_KEY = "sk_live_fixture";
    delete process.env.PAYMENTS_LIVE_ENABLED;
    assert.throws(stripeMode, /disabled/);
    process.env.STRIPE_SECRET_KEY = "sk_test_fixture";
    assert.equal(stripeMode().live, false);
    process.env.STRIPE_OPERATOR_ACCOUNTS = JSON.stringify({ test: { alice: "acct_A", bob: "acct_B" }, live: { alice: "acct_L" } });
    assert.equal(accountForUser("alice", false), "acct_A");
    assert.equal(accountForUser("alice", true), "acct_L");
    assert.equal(accountForUser("bob", false), "acct_B");
    assert.throws(() => accountForUser("bob", true), /not enabled/);
    assert.throws(() => accountForUser("mallory", false), /not enabled/);
    assert.throws(() => accountForUser("__proto__", false), /not enabled/);
    process.env.STRIPE_OPERATOR_ACCOUNTS = JSON.stringify({ test: { alice: "acct_A", bob: "acct_A" } });
    assert.throws(() => accountForUser("alice", false), /one owner/);
  } finally { process.env = before; }
});

test("rejects rounded, negative, oversized and malformed payment amounts", () => {
  const key = "request_1234567890";
  for (const amountMinor of [0, -100, 49, 100.5, 100000000, NaN, Infinity, "500"])
    assert.throws(() => paymentInput({ amountMinor, description: "Repair" }, key), /integer cents/);
  assert.equal(paymentInput({ amountMinor: 12500, description: "Repair" }, key).amountMinor, 12500);
  assert.throws(() => paymentInput({ amountMinor: 100, description: " " }, key), /Description/);
  assert.throws(() => paymentInput({ amountMinor: 100, description: "Repair" }, null), /Idempotency-Key/);
});

test("Stripe raw-body verification rejects tampering and expired signatures", () => {
  const stripe = new Stripe("sk_test_fixture");
  const secret = "whsec_fixture";
  const payload = JSON.stringify({ id: "evt_fixture", type: "payout.paid", livemode: false, account: "acct_A", data: { object: { id: "po_fixture" } } });
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
  assert.equal(stripe.webhooks.constructEvent(payload, header, secret).id, "evt_fixture");
  assert.throws(() => stripe.webhooks.constructEvent(payload.replace("acct_A", "acct_B"), header, secret));
  const expired = stripe.webhooks.generateTestHeaderString({ payload, secret, timestamp: Math.floor(Date.now() / 1000) - 600 });
  assert.throws(() => stripe.webhooks.constructEvent(payload, expired, secret));
});

test("operator routes reject unauthenticated requests before provider access", async () => {
  for (const handler of [createLink, paymentStatus, treasuryBalance]) {
    const response = await handler(new Request("https://example.com/api", { method: handler === createLink ? "POST" : "GET" }));
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
});

test("webhook endpoint rejects unsigned, tampered and mismatched-mode events", async () => {
  const before = { ...process.env };
  try {
    process.env.STRIPE_SECRET_KEY = "sk_test_fixture";
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET = "whsec_fixture";
    const stripe = new Stripe("sk_test_fixture");
    const payload = JSON.stringify({ id: "evt_fixture", livemode: true, account: "acct_A", type: "payout.paid", data: { object: { id: "po_fixture" } } });
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_fixture" });
    const unsigned = await stripeWebhook(new Request("https://example.com/api", { method: "POST", body: payload }));
    assert.equal(unsigned.status, 400);
    const wrongMode = await stripeWebhook(new Request("https://example.com/api", { method: "POST", body: payload, headers: { "stripe-signature": signature } }));
    assert.equal(wrongMode.status, 400);
    assert.match((await wrongMode.json()).error, /environment/);
    const tampered = await stripeWebhook(new Request("https://example.com/api", { method: "POST", body: payload.replace("acct_A", "acct_B"), headers: { "stripe-signature": signature } }));
    assert.equal(tampered.status, 400);
  } finally { process.env = before; }
});
