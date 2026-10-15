# Increase banking API hardening

## Scope and verified baseline

Dedicated branch: `increase`, created from `codex/banking-consolidation` on 2026-10-15. Focus: MyBlue fiat business banking backed by Increase. Social authentication and crypto yield are separate workstreams.

The inspected payment server/configuration currently implement Stripe operator payments and Supabase bearer-token authentication. The inspected branch tree contains no Increase-named client or route. Existing Increase calls have not yet been located; implementation must not be described as hardened until code and tests exist.

Vercel project `myblue-finance-app` (`prj_3rQds32rTpY3NphUkB1LOgKM6aZE`, team `myblue`) owns `myblue.finance` and `app.myblue.finance`. Its inspected production deployment `dpl_AfNV1PJb76BBYeLJ2fSURD3fzhGw` is CLI-sourced with empty Git metadata. This does not establish that this branch matches production. Resolve app-root and source provenance before connecting deployment automation.

## Ordered implementation work

1. Verify current Increase API documentation, supported business account products, account eligibility and sandbox contract. Inventory any existing unpublished Increase implementation before introducing a second client.
2. Implement one server-only Increase client: explicit sandbox/production configuration, fixed provider origins, secret isolation, bounded timeouts, sanitized errors and provider request correlation. Never accept an API origin or credential from a browser.
3. Add a banking authorization boundary: authenticated principal, organization membership and role, server-owned entity/account mapping, per-operation authorization, strict input schemas and request limits. Wallet authentication alone is insufficient to provision a bank account.
4. Implement entity onboarding and account provisioning with eligibility/KYB state gates and a durable operation journal. Persist an operation's idempotency key and canonical request fingerprint before sending a mutation. Reuse the same key after ambiguous failures; reject key reuse with a different payload. Reconcile uncertain results before resubmitting.
5. Implement organization-scoped account, balance and transaction reads with bounded pagination and no shared response caching. Keep provider identifiers opaque and enforce ownership on every lookup.
6. Implement transfers only after approval policy, beneficiary ownership, amount/currency validation, limits and durable idempotency are in place. Model pending, settled, rejected and returned states explicitly. A timeout is an unknown outcome, not proof of failure.
7. Verify webhook signatures using Increase's current documented contract on the raw request body. Persist and deduplicate authenticated events before acknowledgement; process asynchronously with replay protection and reconciliation. Webhook arrival alone must not create spendable balance.
8. Add sandbox integration coverage, deploy a commit-linked preview, verify serverless concurrency and recovery, then evaluate production readiness separately.

## Proposed application route surface

These are proposed MyBlue routes, not claims about Increase endpoint names or implemented routes.

| Route | Intended function | Required gate |
| --- | --- | --- |
| POST /api/banking/onboarding | Create or resume business onboarding | Verified organization role, eligibility, durable idempotency |
| POST /api/banking/accounts | Provision approved account | Provider eligibility and entity state, organization authorization |
| GET /api/banking/accounts | List owned accounts | Server-side organization mapping |
| GET /api/banking/accounts/:id/balance | Retrieve account balance | Ownership check |
| GET /api/banking/accounts/:id/transactions | Retrieve bounded transaction history | Ownership check, pagination limits |
| POST /api/banking/transfers | Submit approved transfer | Limits, beneficiary checks, approval policy, durable idempotency |
| GET /api/banking/transfers/:id | Retrieve transfer status | Organization ownership |
| POST /api/webhooks/increase | Receive provider events | Verified signature, durable deduplication |

## Acceptance evidence

- Cross-organization account, balance, transfer and entity access denied.
- Unauthenticated, unverified and unauthorized issuance requests denied before provider calls.
- Concurrent retries cannot create duplicate accounts or transfers.
- Network timeout after provider acceptance reconciles without a second mutation.
- Rate-limit/server-error handling is bounded; mutation retries retain identity.
- Forged, replayed, duplicate and out-of-order webhook events tested.
- Provider errors and logs contain no credentials, bank details or onboarding PII.
- Missing configuration and persistence failures fail closed.
- Sandbox and production configuration cannot be mixed; preview cannot use live credentials.
- Production app root, exact commit, environment, callback URL and rollback deployment recorded.

No Increase client, API route, live account or transfer is enabled by this planning commit. No yield or savings-rate claim is established by account provisioning.
