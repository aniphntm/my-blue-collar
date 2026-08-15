# Bluework Wallet Authentication, $1 Funding, and Native App — Final Specification

**Date:** 2026-08-15  
**Status:** Approved implementation contract  
**Source product:** `wallet.mybluefinancial.com`

## Decision

Build a native Expo/React Native client for iOS and Android with two account-entry paths:

1. **Continue with Ethereum** proves control of a supported wallet through a server-verified Sign-In with Ethereum message.
2. **Continue with a bank** uses Plaid Link to verify and link an eligible US bank account, then enrolls a Bluework passkey for future login.

The first funding action is a fixed **Deposit $1.00** ACH debit from the linked bank. Plaid Transfer is preferred only if Bluework is approved for the product and its flow of funds fits the bank/custody program; otherwise use Plaid Auth with an approved ACH processor. Sandbox remains the default and must never move real money.

This document supersedes the navigation, authentication, Plaid-placeholder, and money-movement portions of `2026-08-15-bluework-customer-app-design.md`. Its customer language, visual direction, protected-balance framing, and card-program guardrails remain in force.

## Product contract

### Native navigation

Use four bottom tabs on phone and equivalent native navigation on tablet:

| Tab | Purpose |
| --- | --- |
| **Home** | Available today, incoming money, holds, and immediate status |
| **Activity** | Pending, settled, failed, returned, and reversed money events |
| **Pay** | Deposit $1 first; supplier payment remains a clearly labeled sandbox action until its rail is approved |
| **Account** | Card controls, linked bank, wallet identity, security, support, and profile |

Do not present crypto charts, token selection, raw Plaid identifiers, routing/account numbers, or issuer terminology in the primary journey. A wallet signature authenticates the user; it does not transfer ETH, incur gas, or create a dollar deposit.

### Account creation and return login

**Ethereum path**

1. The client requests a one-time server challenge.
2. The wallet signs a standards-conformant EIP-4361 message naming `wallet.mybluefinancial.com`, the expected URI, allowed chain ID, nonce, issued time, and short expiration.
3. The server consumes the nonce once, validates every message field and the signature, then creates or restores the Bluework account and session.
4. Sandbox initially allows Sepolia. Adding mainnet or contract-wallet verification is a separately reviewed server policy; v1 must show an explicit unsupported-wallet message rather than weakening verification.
5. Depositing dollars still requires bank ownership verification and all applicable compliance approval. Wallet control is not KYC.

Never request, display, log, or store a private key or seed phrase. The signing prompt must say that it is a login and not a transaction.

**Bank path**

1. A short-lived onboarding attempt creates a unique, opaque Plaid `client_user_id`; the existing shared `bluework-test-user` value is removed.
2. Native Plaid Link connects one eligible checking, savings, or cash-management account and returns only temporary completion data to the app.
3. The server exchanges the temporary token, verifies the selected account and ownership using the provider-approved Auth/Identity/KYC configuration, and stores only masked metadata plus encrypted provider tokens.
4. After approval, Bluework creates the account and requires passkey enrollment. A verified email one-time link may be the recovery fallback if the selected passkey stack cannot support a target device.
5. Returning users authenticate with the passkey or recovery factor; they do not re-enter bank credentials to log in.

Plaid Link authenticates the user to their financial institution and links an account; it is not a durable Bluework password, complete KYC by itself, or a card issuer. Failed ownership matching, unsupported ownership types, revoked consent, and manual review must be first-class states.

Do not automatically merge accounts based only on a wallet address, bank mask, email, or name. Linking a second identity requires a current session plus step-up authentication.

### Fixed $1 ACH deposit

The production-pilot action is an actual **$1.00 deposit**, not a verification charge and not an automatic refund.

1. The server confirms an active session, eligible linked account, approved compliance state, production feature flag, and fixed amount of exactly 100 cents.
2. The customer reviews source account mask, amount, timing, return risk, required ACH authorization language, and any fee before confirming.
3. The server creates a transfer authorization with a unique idempotency key. Only an approved authorization may create the ACH debit.
4. The initial ledger/UI state is **Pending**. A timeout or retryable provider error must not be treated as failure or trigger a second debit.
5. Verified provider events are the status source of truth. Only the program's approved settled/funds-available event may post the cash credit and affect **Available today**.
6. Failed, canceled, or returned transfers create compensating ledger entries and a plain-language Activity status; financial history is never rewritten.

The destination of funds must be the approved custodial/FBO/program account, never Bluework's ordinary operating account. The client cannot choose the amount, provider account ID, transfer direction, environment, status, or ledger result.

## Native client

Create `apps/mobile/` as an Expo app targeting both iOS and Android. It consumes the existing Next.js server over HTTPS and shares only framework-neutral TypeScript contracts and validation; it must not import DOM code, `react-plaid-link`, Node provider clients, or server configuration.

Use the official native Plaid React Native integration and a native wallet connection/signing adapter after verifying current Expo compatibility and pinned SDK versions. OAuth and wallet callbacks use allow-listed universal/app links and must survive app backgrounding, cancellation, and process restart. Do not use a WebView as the primary app.

Minimum native routes:

- `apps/mobile/app/(auth)/index.tsx` — choose Ethereum or bank
- `apps/mobile/app/(auth)/bank.tsx` — Plaid onboarding and passkey enrollment
- `apps/mobile/app/(auth)/wallet.tsx` — wallet connection and SIWE signing
- `apps/mobile/app/(tabs)/_layout.tsx` — four-tab shell
- `apps/mobile/app/(tabs)/index.tsx` — Home
- `apps/mobile/app/(tabs)/activity.tsx` — Activity
- `apps/mobile/app/(tabs)/pay.tsx` — Deposit $1 and sandbox supplier payment
- `apps/mobile/app/(tabs)/account.tsx` — bank, wallet, card, security, and logout

The existing `app/wallet/page.tsx` and `components/customer-wallet.tsx` remain the web reference implementation. Native behavior should match their useful product states, not their DOM/Tailwind implementation.

### Accessibility completion bar

- VoiceOver and TalkBack expose meaningful labels, roles, values, hints, headings, and logical focus order.
- Authentication, Link, deposit review, success, and error flows work with screen readers and external keyboards.
- Status changes and validation errors are announced; focus moves to the blocking error or confirmation heading.
- Text supports Dynamic Type without clipping; layouts support safe areas, keyboard avoidance, zoom, high contrast, dark/system appearance where offered, and reduced motion.
- Interactive targets are at least 44 by 44 points on iOS and 48 by 48 dp on Android, with more than color distinguishing every status.
- Loading, canceled, offline, expired-session, revoked-bank, pending-review, failed, returned, and retry states are designed, not generic alerts.

## Server and persistence seams

Keep all secrets and privileged operations in server-only modules. Proposed Next.js route boundaries:

| Boundary | Responsibility |
| --- | --- |
| `app/api/auth/siwe/nonce/route.ts` | Issue short-lived, one-use challenges |
| `app/api/auth/siwe/verify/route.ts` | Verify EIP-4361 message/signature and issue a session |
| `app/api/auth/passkeys/**` | Registration/login options and verification through an audited WebAuthn implementation |
| `app/api/auth/session/route.ts`, `app/api/auth/logout/route.ts` | Restore, rotate, revoke, and end sessions |
| `app/api/plaid/link-token/route.ts` | Create per-user onboarding/update Link tokens |
| `app/api/plaid/exchange/route.ts` | Exchange server-side, verify ownership, and persist encrypted connection data |
| `app/api/deposits/authorize/route.ts` | Re-check policy and create the idempotent $1 authorization |
| `app/api/deposits/route.ts` | Create or return the single transfer associated with that authorization |
| `app/api/deposits/[depositId]/route.ts` | Return the authenticated customer's canonical status |
| `app/api/webhooks/plaid/route.ts` | Verify raw-body signature, deduplicate notification, sync provider events, and advance state |

Provider code belongs under `lib/server/auth/`, `lib/server/plaid/`, `lib/server/transfers/`, `lib/server/ledger/`, and `lib/server/compliance/`. Client-safe request/response schemas may live in `packages/contracts/`. A provider adapter must keep Plaid Transfer replaceable by an approved ACH processor without changing the product states.

Use the existing imperative Supabase migration workflow with a CLI-generated migration name. Persist at minimum:

- users and non-user-editable authorization/compliance state
- wallet identities and consumed SIWE challenges
- passkey credentials/recovery factors and revocable sessions
- bank connections and accounts, separated by provider environment
- deposit attempts, provider authorizations/transfers, and immutable ledger entries
- webhook/provider events with unique provider event IDs and reconciliation cursors
- an append-only audit trail for authentication, account linking, compliance decisions, and money movement

Amounts are integer cents; timestamps are timezone-aware; state changes use transactions and constrained transitions. Unique constraints enforce wallet identity, challenge nonce, bank item/account, client idempotency key, provider transfer, and provider event uniqueness. Index ownership keys, pending deposits, and event reconciliation paths.

Financial tables should live in an unexposed/private schema where practical. If any table is exposed through the Supabase Data API, enable RLS and ownership policies; authenticated-role access alone is not authorization. Service/secret keys, Plaid secrets, decrypted access tokens, signing keys, and raw bank data never enter the web or mobile bundle. Prefer processor tokens over retrieving raw account/routing numbers.

Sessions use short-lived access tokens and rotating, one-use refresh tokens with revocation. Store web sessions in `Secure`, `HttpOnly`, appropriately `SameSite` cookies and mobile credentials in OS-backed secure storage. Protect cookie mutations from CSRF, rate-limit every auth and transfer endpoint, redact PII/tokens from logs, and require recent step-up authentication for adding a bank, changing security factors, or initiating a deposit.

Webhook handling must verify the provider signature against the untouched raw body, reject stale or invalid signatures, store events before processing, deduplicate them, and tolerate reordering/retries. A scheduled reconciliation job must sync missed events and compare provider transfers, program-account settlement, and the internal ledger. Alerts cover stuck pending deposits, returns, signature failures, cursor gaps, and ledger mismatches.

## Environment and launch gates

Default configuration is `sandbox`, with an unmistakable **Testnet / no real money** label and simulated $1 transfers. Production requires a separate provider project, credentials, webhook endpoint, database rows, logs, and ledger namespace; sandbox data can never be promoted or mixed with production data.

Real deposits remain disabled unless all of the following are independently true:

- server environment is production and an operational kill switch enables the restricted pilot
- Plaid Transfer production access or an approved ACH processor/originator is active
- a bank/custody/FBO flow of funds and reconciliation process is contractually approved
- KYC/CIP, sanctions/AML, account-ownership, fraud, limits, returns, support, privacy, disclosures, and record-retention controls are approved by responsible partners/counsel
- production webhooks, replay protection, idempotency, ledger reconciliation, monitoring, incident response, and manual review have passed end-to-end tests
- App Store/Play signing, privacy disclosures, and platform credentials are complete

No environment variable alone may bypass compliance state, ownership checks, transfer policy, or finality.

## Tap to Pay boundary

Tap to Pay is not a wallet-funding method in this release. A later, separate merchant-acceptance project may let a Bluework customer accept contactless payments from genuine third-party customers through an approved payment service provider, merchant onboarding, native Tap to Pay SDKs, and distinct settlement/risk operations.

Never support paying one's own Bluework account or business with one's own card, circular funding, cash-out simulation, or a phone acting as both payer and merchant. The present mobile app contains no Tap to Pay SDK, entitlement, button, or fallback card-entry flow.

## Acceptance criteria

- Replaying, altering, or using an expired SIWE challenge fails; no client-asserted address creates a session.
- Bank onboarding uses a unique user attempt, persists no secret in the client, verifies ownership, and enrolls a returning-login factor.
- Repeating the same deposit request, including after a timeout, can create at most one $1 authorization and one transfer.
- Available balance never changes from a client callback or unverified webhook; a later return is reflected by a compensating entry.
- Sandbox and production are visually, operationally, and persistently isolated.
- Core flows pass automated contract/security tests plus VoiceOver and TalkBack device checks on iOS and Android.
- No Tap to Pay or own-card self-payment path exists.

## Implementation-time source check

Before selecting packages or enabling provider calls, verify current official documentation and pin exact versions in the lockfile. Primary contracts are [Plaid Link](https://plaid.com/docs/link/), [Plaid Auth](https://plaid.com/docs/auth/), [Plaid Transfer creation](https://plaid.com/docs/transfer/creating-transfers/), [Plaid transfer reconciliation](https://plaid.com/docs/transfer/reconciling-transfers/), [Plaid webhook verification](https://plaid.com/docs/api/webhooks/webhook-verification/), [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361), and [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). Provider availability, SDK compatibility, statuses, compliance terms, and production approval are deliberately not frozen by this specification.
