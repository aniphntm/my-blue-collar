# MyBlue Financial onboarding — wallet authentication, funding paused

This standalone Vite application lives in `apps/financial-onboarding`. The repository root is a separate application. Changes here retire Privy only from Financial onboarding; they make no statement about other MyBlue apps.

## Reconciliation and provenance

PR #3 originally contained Privy authentication, embedded-wallet lookup and Privy JWT verification at `1e8384480b0ef84c97dbaa8314979fb2592d31d4`. Those dependencies, browser integrations, environment variables and server calls have been removed from this application and its lockfile.

The prior connection-only preview was `https://mybluefinancial-3bcpsj2m2-myblue.vercel.app/wallet` (deployment `dpl_2zpENDWavBoaBHDTSmGk7nrU5wwk`). Vercel reports a CLI deployment with no Git metadata. Its source tree includes `src/wallet.ts` and a `/wallet` entry; the file retrieval tool truncates the wallet source. This revision implements the same direct browser-wallet approach and adds verified authentication; it is not represented as an exact import of that unpublished working copy. The old preview has not been redeployed by this change.

## User flow and supported accounts

1. Open `/wallet` (also served for `/login`, `/create`, `/signup`, `/register`, `/onboard`) on the configured origin. Choose an installed EIP-6963 browser wallet or the legacy injected provider. On mobile, use a wallet's built-in browser. No QR WalletConnect integration is implied.
2. Approve account access and select Base (chain 8453). Connection alone is not authentication. The app never silently switches networks.
3. Select **Verify wallet**. The server issues an EIP-4361 message with the exact domain, URI, address, chain, random nonce, issue time and five-minute expiry. `personal_sign` signs that human-readable message; no transaction, token approval or transfer is requested.
4. The server recovers the EIP-191 signer from its stored message and compares it with the challenged address. The request may supply only the signature, never a replacement message, origin, address or destination. One atomic compare-and-swap consumes the challenge and creates a server session. Concurrent verification/replay has at most one winner.
5. Funding remains optional and unavailable. The page never opens a checkout. Returning from a provider is not funding confirmation.

Supported verification is externally owned Ethereum accounts using 65-byte EIP-191 signatures. Contract wallets/EIP-1271, counterfactual wallets, Solana, account linking and custodial accounts are not supported. Do not claim general wallet compatibility from browser provider discovery alone. There is no embedded wallet creation or server custody of wallet keys.

## Session, cancellation and recovery

- A server-generated 256-bit opaque identifier is held only in `__Host-myblue-session`: Secure, HttpOnly, SameSite=Strict, Path=/, no Domain. It initially identifies a pending challenge and is never supplied by the client or returned in JSON. The store hashes the identifier for its key.
- Sessions last at most one hour, with absolute expiry checked server-side on every authenticated read. Challenges last five minutes. Sessions are bound to the verified address, Base chain and exact configured HTTPS origin. Sessions do not cross subdomains; deploy and authenticate on one canonical origin. Switching origin requires a fresh proof.
- A shared Redis REST store holds challenges and sessions. Production has **no in-memory fallback**. Redis TTLs bound retention; a Lua compare-and-swap atomically consumes challenges across instances. Store failures return 503 rather than accepting a session.
- Cancel/disconnect/logout deletes the server record and expires host and legacy session cookies. A verification response does not set a new cookie, so a late response cannot recreate one after logout. Browser mutations are serialized; cancelling during connection/signature requests ignores late wallet results. Account, chain and disconnect events revoke the session and require a fresh proof.
- Failed logout is shown honestly and can be retried. An offline client cannot promise immediate server revocation; absolute expiry remains the backstop. A closed page does not itself revoke the session. Do not equate a UI disconnect with revocation until the DELETE succeeds.
- Reload/recovery requires reconnecting and signing again with the same wallet. Another wallet is another identity. MyBlue cannot recover a lost key, migrate an old Privy identity automatically, or access an old embedded wallet. Users must retain access to their original wallet through their wallet provider's supported recovery/export process. Never ask for seed phrases or private keys.
- Challenge issuance is capped at 120/minute per origin in shared storage. This is an availability backstop, not a complete abuse defense; deploy per-client rate limiting and verify it before release.

## Configuration (server only)

Use `.env.example` names through the deployment secret manager; never commit credentials or put them in `VITE_` variables:

| Name | Purpose |
| --- | --- |
| `AUTH_ORIGIN` | One exact HTTPS origin, no path/trailing slash/wildcard; requests must match host and origin |
| `AUTH_REDIS_REST_URL` | HTTPS origin of a provisioned Redis REST endpoint implementing GET, SET NX EX, DEL and EVAL |
| `AUTH_REDIS_REST_TOKEN` | Server-only Redis authorization token, access restricted to the auth store |

Unset configuration keeps sign-in unavailable (503). Local Vite serves UI only; use an HTTPS function-capable preview for real integration testing. No datastore or credentials have been provisioned by this change. A real shared-store integration test is still required; unit tests use a test-only store implementing the atomic contract and mocked REST transport.

## Funding interlock and retained integration code

`GET /api/funding` exposes only a verified server session's wallet and reports providers unavailable. It never reads an address from query/body input. Anonymous/expired/unverified sessions get 401; unconfigured authentication gets 503. `POST /api/funding` rejects destination/callback overrides and returns 503 even with valid credentials. Both Coinbase and Robinhood are blocked. There is **no environment toggle** that enables transactions and no provider-session request in the handler.

CDP signing, provider URL allowlisting and exact Base ETH/USDC observation helpers remain isolated and tested for a future reviewed integration. They are not wired to an active funding or balance path. No credential presence is interpreted as account approval. Future funding must derive the destination exclusively from the authenticated session, re-check session validity at launch, and bind provider order/status records to that session's address and chain. Query parameters, arbitrary addresses, browser state, balances and a provider return URL are never evidence of completed funding.

Before any separate change enables funding:

- Verify durable-store atomicity, expiry and revocation across deployed instances; test exact origins, HTTPS cookies, per-client rate limiting, account changes, cancellation and replay against the deployment.
- Complete a human connection/sign-in/recovery test with each advertised wallet. Independently review authentication and session handling.
- Confirm Coinbase organization/account approval, applicable geography, current product/API contract and approved exact callback origins. Provision scoped credentials only through a secret manager.
- Coinbase documentation flags hosted **guest checkout** as discontinued June 30, 2026; do not revive a legacy guest debit-card/Apple Pay flow. Confirm whether the approved product is hosted Coinbase-account login or Headless Onramp before implementing its contract.
- Use an explicitly approved sandbox/non-value flow first, including destination binding, provider URL validation, cancellation, timeout, callback/order ownership and authenticated status verification. The old signing helpers alone do not establish API compatibility.
- Only after the preceding checks, make a separately reviewed release change and perform an explicitly authorized small user-funded transaction. Confirm the exact destination/network and provider order status. No live funded test has been performed here.
- Robinhood remains unavailable without its issued partner Application ID, approved SDK contract and separate validation.

## Validation

Run from this directory with Node 24:

```sh
npm ci --ignore-scripts
npm test
npm run typecheck
npm run build
```

Build policy scans source/lockfile and built output for retired authentication imports/configuration. Tests exercise real wallet signatures, wrong signer/message/domain/chain, replay/concurrent consumption, expiry, cancellation races, logout, malformed inputs, origin/cookie checks, user rejection/account changes, funding interlocks and retained provider helpers. No human wallet, live datastore, real Coinbase checkout, or production deployment is implied by these tests.

References: [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361), [Viem SIWE](https://viem.sh/docs/siwe/utilities/createSiweMessage), [Redis REST EVAL](https://upstash.com/docs/redis/commands/scripting/eval), [Coinbase Onramp overview](https://docs.cdp.coinbase.com/onramp/onramp-overview).
