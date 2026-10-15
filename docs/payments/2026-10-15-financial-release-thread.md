# MyBlue Financial release thread — October 15, 2026

> Technical thread: Consolidated the payments plan, gated treasury APIs and verified-wallet onboarding into separate squash commits on a main-based release candidate; Alchemy confirms BLUE's three network configurations, while fiat funding, production routing and liquidity pools remain pending verified provider and deployment setup.

## Source reconciliation

Base: `742a06071e01318fd931224a06e2c045d7cc442a` (`origin/main`).
Candidate: `codex/banking-consolidation`.

Operational handoff: [Stacy release operations runbook](financial-ops-runbook.md).
Adobe handoff delivery is unconfirmed because the Stacy connection returned a
service error; proposed owners and telemetry are documented there.

| Source branch and frozen tip | Squash commit | Scope |
| --- | --- | --- |
| `payments` — `723375ac194ee44491d014635e98baad567272f1` | `273f0cf` | Apple Pay funding plan only |
| `treasury` — `87f4cb241a636a007b14b61603cdaf10f3976fce` | `7392a9f` | Operator payment links, status, webhook receipt journal and finalized ETH balance observation |
| `work/on-deck/myblue-onboarding` — `e6e5377992ce1fb57125943632bfaa1621019169` | `42a47fd` | Standalone verified-wallet onboarding; funding remains paused |

Three-way squash merges preserve main's hiring, assets and Financial motion work.
The integration also excludes the standalone onboarding app from the root
TypeScript project: its ES2022 configuration is checked separately from Next.js's
ES2017 configuration. Without this separation, root type checking rejects its
BigInt literals.

`wallet` includes unrelated network, media and homepage changes and was not
merged wholesale. The focused MyBlueCoin homepage release remains PR #2.
PR #3 is the source of the onboarding candidate; this consolidation does not
close it or establish that its security and provider release checks passed.

## Verified locally

- Clean dependency installation with lifecycle scripts disabled for both apps.
- Five payment-rail tests passed, including unauthorized endpoint access and
  webhook signature/environment rejection.
- All 28 onboarding tests passed, including actual signature verification,
  replay, cancellation, revocation and funding interlocks.
- Standalone TypeScript, Vite build and retired-authentication policy scans passed.
- Root Next.js production build (including TypeScript) and targeted banking lint
  passed after separating the TypeScript projects.
- `git diff --check` passed.

These are local checks. They do not verify a real shared datastore, human wallet
interaction, provider checkout, banking settlement, deployment or pool creation.

## Observed external configuration

Read-only connector observations on October 15, 2026:

- Vercel team `myblue`, project `mybluefinancial`
  (`prj_gsk6hiX4VI6Wou3mC8TXNZjHs6gn`) lists `mybluefinancial.com`,
  `www.mybluefinancial.com`, `wallet.mybluefinancial.com` and
  `onboard.mybluefinancial.com` among its domains. `app.myblue.finance` is absent
  from that project's domain list. This does not establish its status elsewhere
  or prove current HTTP behavior. No DNS or project setting was changed.
- Alchemy `myblue_bridge` (`lh6arr2d54y5zlj4`) enables `SOLANA_MAINNET`,
  `BASE_MAINNET` and `ETH_MAINNET`.
- Alchemy `Customer Treasury Rail` (`wpg42h9v61dv31l2`) enables `ARC_MAINNET`,
  `ROBINHOOD_MAINNET` and `ROBINHOOD_TESTNET`. The treasury endpoint in this
  candidate instead accepts only `eth-mainnet` or `eth-sepolia`; do not assume
  the older app supports it. Configure a suitable app through secret management.
- This managed runtime reports no configured secrets or outbound identities.
  Connector access does not provision credentials into the application runtime.
- Neither `pmxt` nor `kraken` was found as an installed CLI. Tool discovery found
  no Coinbase, Robinhood, Kraken or PMXT connector for transaction execution.

Alchemy network access supplies blockchain infrastructure. Robinhood Chain
configuration does not establish Robinhood Connect approval. None of these
observations establishes fiat settlement, exchange listing or BLUE liquidity.

## Remaining release work

1. Confirm the intended Vercel project and root directory for `app.myblue.finance`.
   The Next.js repository root and `apps/financial-onboarding` are separate apps.
   Verify domain ownership/routing, then deploy an exact-commit preview using one
   canonical HTTPS origin. Do not transfer existing domains by assumption.
2. Provision the onboarding origin and shared Redis store securely; verify
   deployed atomicity, expiry, revocation, per-client abuse controls and human
   wallet sign-in/recovery. Complete authentication review. Local test stores are
   not evidence of deployed behavior.
3. Coinbase funding is blocked in code, including with credentials or flags.
   Verify account/product eligibility and the current API contract, then implement
   authenticated order/destination/status binding and sandbox validation. Do not
   treat retained signing helpers as an active integration. The source README
   records a June 30, 2026 hosted guest-checkout retirement warning; recheck the
   current provider contract before choosing a flow.
4. Robinhood needs its issued partner configuration and validated contract.
   Kraken has no funding adapter in this candidate; establish the intended
   supported product/API and account access before implementation. No provider
   is described as live based on an Alchemy network setting.
5. Treasury payment release additionally needs verified Connect capabilities,
   operator mappings, the versioned receipt migration, webhook delivery and
   provider checkout/payout tests. The imported link handler's explicit payment
   method list also needs review against current Stripe payment-method
   configuration guidance before enablement. Preserve the existing live gate.
6. Verify exact-commit deployment behavior, authentication, funding rejection,
   hostname routing and provider callbacks before a production promotion.

No live flags, credentials, database migrations, provider settings, production
deployment or value transfers were changed by this consolidation.

## BLUE pool preparation

Addresses below are repository declarations from `public/coin/myblue-ethos.md`,
not fresh on-chain validation:

| Network | BLUE token | Representation |
| --- | --- | --- |
| Solana | `9ATRuAmVCqtZmtYPfJG7YfwPuythCvVV5T9EjPCkPLEX` | Original |
| Base (8453) | `0x57f03284A5D7bE8484121092f0463834Bfd4802c` | Wormhole wrapped |
| Ethereum (1) | `0xccf412f3d132473f3830e9fa6f62980cd1646f32` | Wormhole wrapped |

For each network, the missing execution inputs are the DEX/venue and supported
pool program/router, quote-token address, initial price, BLUE and quote amounts,
fee tier/range where applicable, slippage/deadline, funding wallet and LP recipient.
Also resolve what `@pmxt` and `@lraken` identify before installing or invoking tools.
Never substitute a centralized exchange order for an on-chain pool.

Once specified, verify token identity, decimals, bridge representation, existing
pools, wallet balances and gas; prepare and simulate the exact transactions, then
record the reviewed execution parameters and resulting pool addresses and receipts.
No pool address, transaction hash or active liquidity is claimed here.
