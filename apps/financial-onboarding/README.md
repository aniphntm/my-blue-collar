# MyBlue Financial funnel

Production source for the Financial static landing, Privy React login/account setup, and verified onboarding session handoff.

- `https://mybluework.com/coin` proxies the Financial landing through a host-scoped Vercel project route. `/coin/*` includes images and manifesto assets.
- Login and create entrypoints live at `https://mybluefinancial.com/login` and `/create?provider=coinbase|robinhood|walletconnect`.
- Privy authenticates through email or an external wallet. Embedded EVM wallets are created only after an explicit user action; existing embedded wallets are reused. No transactions or delegated signers are requested.
- Coinbase has a configuration-gated funding backend; Robinhood remains a funding preference pending partner setup. WalletConnect is the external-wallet login path supplied by Privy.
- `POST /api/session` verifies Privy ES256 signature, issuer, audience, subject, and expiration before setting a Secure, HttpOnly, SameSite=Lax cookie on `mybluefinancial.com`. No tokens are placed in URLs.
- `onboard.mybluefinancial.com/<opaque-user-id>` verifies the same session; the URL is a deterministic identifier, never an access credential. Visiting a different ID resumes the signed-in user's own ID.
- Privy SDK sessions remain on the Financial origin. The onboarding page uses only the verified backend session, avoiding a second SDK login on another origin.
- Funding destinations come from a server lookup of the verified Privy user. The onboarding page shows separately observed Base balances when Alchemy is configured; balances and provider returns never prove a completed purchase.

Required environment: `PRIVY_APP_ID` (public application identifier). Privy must allow `https://mybluefinancial.com` and `https://www.mybluefinancial.com` for SDK use. The onboarding origin uses the shared backend session. Enable email and wallet login in Privy, and configure the app's external-wallet/WalletConnect settings. No Privy app secret is required for JWT verification against its public JWKS.

Run `npm ci`, `npm run typecheck`, `npm test`, `npm run build`. Deploy with `vercel deploy --prod --scope myblue` only after verifying `.vercel/project.json` points to `myblue/mybluefinancial` (`prj_gsk6hiX4VI6Wou3mC8TXNZjHs6gn`).

The Work project routes are managed separately with `vercel routes ... --project my-blue-collar --scope myblue`. Routes are host-limited to mybluework.com and www.mybluework.com: coin rewrite, login redirect, create redirect, and onboarding redirect. Review drafts with `vercel routes list --diff`, then publish. Financial's previous production deployment is `mybluefinancial-lf3cf2apr-myblue.vercel.app` for rollback.

A real first-user login, wallet creation, recovery/export, and signed-in cross-domain handoff require the user to complete Privy's authentication UI. Never treat a rendered modal or mocked JWT tests as proof those user flows succeeded.

## Coinbase funding backend

`GET /api/funding` authenticates the existing session cookie and resolves the embedded Ethereum wallet through Privy's server API. It returns `wallet`, `asset: USDC`, `network: base`, and `providers.coinbase` / `providers.robinhood` availability/mode/reason plus `balances`. `POST /api/funding` accepts `{ "provider": "coinbase" }` and returns a provider `url`. `{ "provider": "robinhood" }` returns 503 until a verified partner integration exists; other providers/extra fields are rejected. Both routes enforce a trusted request host and same-origin access; POST requires an exact Origin header. No recipient, amount, country, or callback is accepted from the browser.

Copy the variable names in `.env.example` into your server environment. In addition to `PRIVY_APP_ID`, funding requires `PRIVY_APP_SECRET`, `CDP_API_KEY_ID`, and `CDP_API_KEY_SECRET`. Use a CDP Secret API key with Onramp access: ES256 P-256 PEM (real newlines or escaped `\n`) or base64 Ed25519 64-byte seed+public secret. Keep these three secrets server-side; never prefix them with `VITE_` or commit their values. Missing/invalid key configuration reports unavailable. An unavailable Privy lookup returns an error, never an invented wallet.

`COINBASE_ONRAMP_MODE` defaults to `sandbox`, which prefixes the opaque partner reference with `sandbox-`. Set `production` explicitly only after provider setup and sandbox validation. Production permits only `https://pay.coinbase.com`; sandbox also permits `https://pay-sandbox.coinbase.com`. Redirects return to the verified user's fixed onboarding URL with `funding=returned`; a return does not prove a purchase or deposit. Set `FUNDING_PREVIEW_ORIGIN` only when needed to one exact trusted HTTPS preview origin without a trailing slash; preview cookies remain local to that host.

Provider setup references: [Create Onramp Session](https://docs.cdp.coinbase.com/api-reference/v2/rest-api/onramp/create-an-onramp-session), [CDP authentication](https://docs.cdp.coinbase.com/api-reference/v2/authentication), and [Privy user lookup](https://docs.privy.io/api-reference/users/get). The Coinbase session reference documents the `partnerUserRef` field used for the sandbox prefix. Configure allowed domains/redirects in the provider dashboard as required. No live credentials, session creation, funds movement, or production deployment were used to verify this backend.


## Onboarding, Robinhood partner setup, and Base balances

The public onboarding page loads funding options only after session verification and the signed-in user's path check. It shows the verified receiving address and **USDC on Base** before a launch button appears. Sandbox is labeled on both context and button. Clicking the Coinbase button creates an authenticated server session; the browser independently validates the returned provider, mode, asset, network, and exact HTTPS provider origin. Funding remains optional and WalletConnect retains its existing wallet management path. Provider return parameters are informational only: no transaction status, completion, or purchase causality is inferred from a redirect or observed balance.

Robinhood returns `available: false`, `mode: unavailable`, `reason: partner_setup_required`. There is no guessed Robinhood URL, SDK package, callback, or credential variable. The consumer page offers fund later and, when configured, Coinbase. Developer setup requires:

1. Apply through the **Let's connect** partner form on the [official Robinhood on-ramp page](https://robinhood.com/us/en/on-ramp/). The [partner form](https://docs.google.com/forms/d/e/1FAIpQLSexjyp2eyvsKh8Qubz-ezhEjGQgYG106FGv_BS8g6ExJmlRow/viewform) is a developer application, not a consumer funding destination.
2. Obtain a Robinhood-issued **Application ID**, the supplied SDK and integration documentation under its [Connect Tools license](https://cdn.robinhood.com/assets/robinhood/legal/Robinhood-Connect-Tools-License-Agreement.pdf). Confirm the documented environment, supported assets/networks, receiving-wallet binding, launch method, approved origins/callbacks, and transaction-status verification contract.
3. Implement and test that supplied contract against the verified Privy wallet before enabling availability. Callback handling must not claim completion without provider verification. Robinhood Trading API, WalletConnect, Robinhood Chain RPC, and an [Alchemy directory listing](https://www.alchemy.com/dapps/robinhood) do not provide this Connect contract.

For optional balance observations, add `ALCHEMY_API_KEY` to the server environment using `.env.example`; never expose it through `VITE_` or browser code. The verified Alchemy app `myblue_bridge` (`lh6arr2d54y5zlj4`) supports Base mainnet, but the connector reveals only a masked API key; balance reads have not been activated. Current Vercel configuration has only `PRIVY_APP_ID`; funding and balance credentials still need secure provisioning.

The server fixes the endpoint to `https://base-mainnet.g.alchemy.com/v2/{key}` and validates the key as one path segment. It calls `eth_getBalance` and `alchemy_getTokenBalances` for the verified wallet and only Circle's official Base USDC contract `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`. It checks JSON-RPC IDs/errors, response address, token contract/error, and bounded hexadecimal balances before exact BigInt conversion (ETH 18 decimals, USDC 6). No floating-point rounding is used.

`balances` returns `{ available: true, network: "base", observedAt, native: { asset: "ETH", amount }, token: { asset: "USDC", amount } }`, with decimal strings. Missing configuration/wallet or any upstream/malformed response returns `{ available: false, network: "base", reason }` with no amounts. A real successful zero remains distinguishable from failure. The observation timestamp is the server read time; the two reads use latest state and are not an atomic block snapshot. These balances are independent of on-ramp transaction status.

References: [Alchemy Base API](https://www.alchemy.com/docs/base/base-api-overview), [token balances](https://www.alchemy.com/docs/data/token-api/token-api-endpoints/alchemy-get-token-balances), [Circle USDC addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses). Run `npm test`, `npm run typecheck`, and `npm run build`. Node VM DOM tests cover browser control flow, not real provider/Privy authentication or visual browser validation.
