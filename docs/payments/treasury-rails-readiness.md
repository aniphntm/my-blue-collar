# Treasury and operator fiat rails

Status: backend candidate, not production-ready. No live payments, account
creation, payouts, wallet transactions, or provider configuration were performed.

## Verified September 7, 2026

- Repository: aniphntm/my-blue-collar. Main and payments branch contain sandbox
  Plaid linking, not a Stripe backend. The exchange discards the access token;
  the link flow uses a shared test user and must not be switched to production.
- Supabase blue-collar-db is healthy. Treasury accounts, deposits, ledger and
  exports tables exist but are empty. No Edge Functions are deployed.
- Alchemy app `wpg42h9v61dv31l2`, Customer Treasury Rail, exists; no Notify
  webhooks were returned for it. App existence does not establish wallet custody.
- The session exposes Alchemy, GitHub and Supabase tools, but no Stripe tools or
  Stripe/Alchemy/Plaid runtime credentials. Existing Stripe deployment secrets
  have not been inspected. Connect approval and capabilities remain unverified.

## Implemented in this branch

The pilot uses Stripe Connect direct charges: customer -> operator Stripe balance
-> operator bank through Stripe payouts. Stripe manages card details and bank
payment mandates in hosted Payment Links. MyBlue application fees are omitted.

| Endpoint | Behavior |
| --- | --- |
| POST /api/payments/links | Authenticated operator creates a reusable USD payment link. Body: amountMinor (integer cents), description. Required Idempotency-Key header: 16–80 alphanumeric, underscore or hyphen characters. |
| GET /api/payments/status | Authenticated operator reads available/pending balances, onboarding requirements and latest 20 payouts directly from Stripe. Amounts are minor units. |
| POST /api/webhooks/stripe | Verifies raw-body signature, checks environment and persists a deduplicated Connect event receipt. Returns 503 on persistence failure so Stripe retries. |
| GET /api/treasury/balance | Authenticated mapped owner reads finalized native ETH balance using Alchemy; verifies Ethereum chain ID and returns exact wei as a decimal string. |

All operator endpoints require `Authorization: Bearer <Supabase access token>`.
Supabase Auth verifies the token on the server. A server-managed environment map
binds each approved pilot user to exactly one Connect account per environment.
Clients cannot choose the receiving account. Anonymous users are rejected.
This is a small pilot mapping, not multi-user business membership or self-service
Connect onboarding. Onboard accounts using Stripe before mapping them.

Live Stripe keys are rejected unless PAYMENTS_LIVE_ENABLED=true. Card payments
are the default; ACH requires both the environment flag and active connected
account capability. Payment creation requires charges and payouts enabled,
US account country and USD settlement. Automatic payout schedules must be
verified in Stripe: this implementation observes them, it does not change them.

Payment Links intentionally support repeated purchases; they are not single-use
invoice payments. Reuse the same request key when retrying a link creation.
Stripe's idempotency window is at least 24 hours, not indefinite. Do not blindly
retry old operations; check the connected account's existing Payment Links.
No custom manual payout or transfer endpoint is exposed.

Webhook receipts are an audit journal, not a financial ledger. The code does not
mark funds settled on checkout completion, credit bUSDC, calculate yield, initiate
fulfillment or sweep customer receipts into Ethereum. Pending/available balances
and payout outcomes are obtained from Stripe; ACH returns and disputes can still
affect balances. Apply event-receipts.sql through a versioned migration before
registering the webhook. RLS and revoked client grants make the journal
server-only; the primary key deduplicates deliveries without ordering assumptions.

## Remaining work before real money

1. Verify the intended deployed repository/project and Stripe account. Enable
   Connect and complete onboarding for the first operator; confirm US/USD,
   charges_enabled, payouts_enabled, active card capability and bank payout
   schedule. Bind the verified Supabase user UUID in the server map.
2. Apply the reviewed receipt schema as a migration, deploy this backend,
   configure secrets from rails.env.example, and register a Connect webhook
   destination (events on connected accounts). Subscribe to account.updated,
   checkout.session.completed, checkout.session.async_payment_succeeded,
   checkout.session.async_payment_failed, payment_intent.succeeded,
   payment_intent.payment_failed, charge.refunded, charge.dispute.created,
   charge.dispute.closed, payout.created, payout.updated, payout.paid,
   payout.failed and account.external_account.updated. Preserve raw request body.
3. Run Stripe test-mode hosted checkout end-to-end; verify available/pending
   balances, webhook retry/deduplication, refund, dispute, ACH asynchronous
   failure/return (if enabled), and test payout success/failure. Test two operators
   for isolation. The tests in this branch do not substitute for provider tests.
4. Integrate existing authenticated owner UI with these endpoints after frontend
   review. Existing wallet/issuer screens remain demonstrations and must not
   present synthetic balances or connection notices as production outcomes.
5. Plaid production needs more than a secret: client ID, approved Auth access,
   individual-user Link flow, secure token lifecycle and account ownership,
   Stripe integration connection, and Stripe manual enablement for the Plaid
   Payment Intents integration. The existing sandbox endpoints are unchanged.
   Stripe-hosted card collection and operator payouts do not depend on Plaid.
6. Alchemy RPC key and verified owner wallet mapping enable balance observation.
   Treasury deposits/withdrawals still need signing/custody, wallet ownership
   verification, chain finality/reorg reconciliation, gas and token policy, and a
   funded fiat/crypto conversion provider. Alchemy RPC is not fiat settlement,
   a hedge venue, custody approval or a yield source. Do not enable treasury
   withdrawals or advertise fiat redemption from this balance endpoint.
7. Only after provider tests and account readiness are verified, enable the live
   flag and perform a separately authorized small live payment/payout check.

## Sources

- https://docs.stripe.com/connect/payment-links
- https://docs.stripe.com/connect/payouts-connected-accounts
- https://docs.stripe.com/api/idempotent_requests
- https://plaid.com/docs/auth/partnerships/stripe/
- https://supabase.com/docs/reference/javascript/auth-getuser

## Validation

Local tests cover live-key gating, test/live account isolation, duplicate owner
mapping rejection, integer amount bounds, idempotency-key validation and Stripe
webhook signature tampering/expiry. TypeScript and targeted lint are run for the
new backend. No provider integration or live money movement has been verified.
