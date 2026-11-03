# MyBlue Financial operations handoff

Prepared October 15, 2026 for Stacy's requested operations work on
[PR #4](https://github.com/aniphntm/my-blue-collar/pull/4).
Baseline evidence: [Financial release thread](2026-10-15-financial-release-thread.md)
and [onboarding implementation](../../apps/financial-onboarding/README.md).

## Handoff status

Stacy is the requested operations coordinator. Adobe CX Enterprise Coworker's
Stacy connection returned `UNAVAILABLE / Internal error` on both attempts to
request the assessment. No Adobe conversation ID or accepted assignment was
returned. This runbook was prepared locally; it is not an Adobe-generated
assessment. No Adobe organization, sandbox, schema, dataset, journey or audience
was inspected or changed.

PR #4 is open, draft and unmerged at the latest read. Its candidate contains
33 passing local tests and two passing builds; deployed validation remains open.
Funding is paused in code. BLUE pools are uncreated. The existing runtime reports
no provisioned secrets or outbound identities. Owners below are proposed roles;
no human has accepted an assignment through this document.

## Work queue and closure evidence

| Priority | Work item | Proposed accountable role | Dependency | Evidence required to close |
| --- | --- | --- | --- | --- |
| P0 | Restore Stacy handoff | Operations coordinator | Adobe service availability | Successful response from Stacy's selected connection and retained conversation ID; confirm the intended Adobe context before any mutation |
| P0 | Establish release destination | Release engineer | Intended Vercel project/root and domain ownership | Project ID, app root, canonical `app.myblue.finance` routing, HTTPS and exact commit/deployment mapping verified |
| P0 | Verify deployed wallet authentication | Identity engineer | Destination plus securely provisioned auth origin/Redis | Cross-instance replay/expiry/revocation tests; origin/cookie checks; per-client limits; human wallet connection, cancellation and recovery; security review findings resolved |
| P0 | Establish provider readiness | Payments integration lead | Selected provider product/account | Coinbase current contract and eligibility; Robinhood partner configuration; Kraken supported product and adapter scope; each provider has documented test evidence before being advertised |
| P0 | Validate operator payment rails | Payments integration lead | Verified Stripe account, mappings and database environment | Receipt migration/version, webhook retries/deduplication, operator isolation, checkout/refund/dispute and payout outcomes; current payment-method configuration reviewed |
| P1 | Instrument operational signals | Product engineer | Event contract below and chosen telemetry destination | QA events visible in the intended environment; collection permissions, duplicate handling, retention and event ownership verified |
| P1 | Establish support and incident coverage | Support/operations lead | Accepted on-call and escalation contacts | Named primary/backup, support queue, escalation route, rehearsed incident and recovery record |
| P1 | Validate launch candidate | Release engineer | All applicable P0 evidence | Exact-commit HTTPS preview and complete user flow checks; known-good rollback deployment recorded; release decision recorded in PR |
| Separate workstream | Specify and prepare BLUE liquidity | Treasury/liquidity operator | User-specified venue, pair, price, amounts, signer and LP recipient per chain | Token/bridge identity and decimals verified; existing pools/balances/gas checked; exact transactions simulated and parameters recorded before execution |

The first executable step after service recovery is a read-only Adobe readiness
check. Do not assume an AEP dataset or customer journey exists from this plan.
The source implementation still needs engineering work; an ops checklist cannot
enable its blocked funding route.

## Customer experience and operational events

This is a proposed contract, not installed instrumentation. Keep authoritative
operational logs on the server. Send only minimized, consent-appropriate copies
to Adobe after the intended schema/dataset and access model have been verified.

Common fields: event ID, UTC timestamp, environment, release SHA, event name,
outcome/reason enum, provider enum where applicable, chain ID and server-generated
correlation ID. Use a scoped pseudonymous subject only where needed. Keep raw
wallet addresses and provider order IDs in access-controlled operational records,
outside marketing identity fields. Do not collect signatures, challenges, bearer
cookies, tokens, keys, seed phrases, bank/card details or free-text provider errors.

| Proposed event | Authoritative source and emission rule | Operational purpose |
| --- | --- | --- |
| `wallet_connection_result` | Browser; success/rejected/unsupported/cancelled; connection does not assert authentication | Detect wallet compatibility and UX failures |
| `wallet_auth_result` | Server signature verification; accepted/rejected/expired/rate_limited/store_unavailable | Track verified sign-in and service failures separately from user rejection |
| `session_revocation_result` | Server DELETE/store result; client disconnect alone is insufficient | Detect failed logout or revocation |
| `funding_unavailable` | Verified funding API response with bounded reason code | Expected paused-funding behavior, distinguished from unexpected failure |
| `funding_order_state` | Future server adapter; verified provider status bound to authenticated order, destination and chain | Track pending/failed/cancelled/completed only after an adapter exists; return-page visits never imply completion |
| `payment_receipt_result` | Server after webhook verification and receipt persistence attempt | Detect persistence failure and duplicate delivery; a receipt is not a settled ledger credit |
| `reconciliation_exception` | Future authenticated reconciliation worker comparing provider orders/settlement and internal records | Route unmatched or inconsistent records for investigation without automatic credit/retry |
| `support_case_state` | Support system with category/status and correlation reference | Track unresolved onboarding/funding cases without copying conversation contents into analytics |

Future funding/reconciliation events stay disabled until their authoritative
integration exists. Preserve separate denominators for rejected wallet prompts,
unsupported wallets, successful verifications and infrastructure failures. Do not
publish conversion or availability numbers before validating collection.

## Operating routine

At each release checkpoint, the coordinator records the candidate SHA, deployment
ID, environment, open P0s, proposed/accepted owners and links to closure evidence.
The present record is **blocked for production**. Missing evidence remains open;
an account, RPC network, local test or provider return page does not close it.

Before promotion, exercise the exact deployed origin: connect and verify a
supported Base EOA wallet, cancel, change account/chain, revoke and retry, and
confirm session expiry. Confirm unverified funding access is rejected, verified
funding remains unavailable, destination overrides are denied and secret material
is absent from responses and telemetry. Run provider sandbox and reconciliation
checks when those integrations are implemented. Record actual outcomes.

Suggested incident triggers are any unauthorized session or destination change,
any successful funding launch while paused, leaked credentials, webhook signature
verification failure caused by configuration, or inability to persist receipts
and revoke sessions. Thresholds for error rates and backlog age must be set from
validated telemetry and accepted service targets, not invented from local tests.

For an incident, the on-call owner records scope/time/release/correlation IDs,
contains affected entrypoints and preserves sanitized evidence. Keep receipt
failures retryable and do not manually replay a payment without checking its
provider identity and idempotency history. Escalate authentication or money-state
inconsistencies to identity/payments owners; support uses the verified incident
status and never asks for a seed phrase or private key.

For rollback, record and restore the previously verified deployment and matching
configuration; confirm routing and funding rejection afterward. A deployment
rollback does not revoke durable sessions, undo database migrations, reverse
settled payments or remove on-chain liquidity. Handle affected sessions through
the existing revocation mechanism; reconcile external money states separately.
Do not roll back into weaker session authentication. If no safe known-good
deployment exists, contain the affected entrypoint until recovery is verified.

No campaigns, journeys, audiences, support messages, analytics collection,
production settings or financial transactions were activated by this handoff.
