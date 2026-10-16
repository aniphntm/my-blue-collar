# MyBlue Financial release thread — October 15, 2026

> Technical thread: Consolidated the payments plan, gated treasury APIs and verified-wallet onboarding into separate squash commits on a main-based release candidate; Alchemy confirms BLUE's three network configurations, while fiat funding, production routing and liquidity pools remain pending verified provider and deployment setup.

## Source reconciliation

### October 16 continuation: release remains blocked

Technical thread update: the banking candidate has a READY Git preview for the
root application, while the requested hostname belongs to a separate production
project. Its source still needs reconciliation with the candidate; authenticated
onboarding and Coinbase, Robinhood and Kraken funding are not verified live.

- PR [#4](https://github.com/aniphntm/my-blue-collar/pull/4) remains an open,
  mergeable draft at inspected head
  `76ad3cd40553d92051c68feb6ec6b8ef25001356`. Its three source squash commits
  are present, but none has been merged into `main` by this continuation.
- Vercel reports Git preview `dpl_JDJVZX3czN1MmKVe2HczJWwreuED` READY for
  that exact head in project `my-blue-collar`, team `myblue`:
  <https://my-blue-collar-7bs2tvkj8-myblue.vercel.app>.
  This is the root Next.js application, not evidence that the separate
  `apps/financial-onboarding` Vite application or its API functions are deployed.
  READY is deployment metadata, not an end-to-end authentication result.
- A fresh, complete Financial project domain listing contains 14 entries and
  excludes `app.myblue.finance`. A direct lookup of that domain in
  `mybluefinancial` returns `404 / Project Domain not found`. This only establishes
  absence from that project; it does not establish DNS state or ownership
  elsewhere. Existing Financial domains must not be moved by assumption.
- While this update was being prepared, the remote release branch advanced to
  `592b842` with additional deployment evidence. Those changes were preserved.
  A fresh project lookup confirms `myblue-finance-app`
  (`prj_3rQds32rTpY3NphUkB1LOgKM6aZE`) in team `myblue` lists both
  `app.myblue.finance` and `myblue.finance`, with latest production deployment
  `dpl_AfNV1PJb76BBYeLJ2fSURD3fzhGw` READY. This resolves project ownership
  within Vercel, but does not bind that production source to PR #4.
- Alchemy's current `myblue_bridge` detail still lists Base, Ethereum and Solana
  mainnets. This supplies network infrastructure, not an approved fiat on-ramp.
- Fresh local onboarding validation passes all 28 tests, TypeScript, Vite build
  and source/build authentication policy scans. The existing test suite verifies
  that funding cannot launch even with credentials or enable flags. It does not
  test a live Redis service, human wallet or provider checkout.
- All five payment-rail tests also pass again, including unauthorized requests
  and webhook tampering/mode rejection. Both dependency installs used
  `npm ci --ignore-scripts`; no application implementation changed.
- The requested Slack destination is
  [#banking_war_room](https://aniphntm.slack.com/archives/C0C9R654R1P), channel
  `C0C9R654R1P`, in the connected personal workspace. It is distinct from the
  MyBlueGroup workspace, where the banking-channel search returned no result.

Resume by reconciling the production source and intended app root/canonical
origin, secure shared authentication storage and deployed security/wallet checks,
then validated
provider account/product/API contracts and sandbox evidence. Keep funding paused
and the consolidation draft until those release checks have evidence. No
production promotion, domain change, funding enablement or value transfer was
performed during this continuation.

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

## October 16 continuation checkpoint

Read-only checks reconfirmed PR #4 is open, draft and unmerged at
`76ad3cd40553d92051c68feb6ec6b8ef25001356`; main and all three source tips
in the reconciliation table are unchanged. The prior local validation above
was not rerun during this documentation checkpoint.

The `mybluefinancial` project still lists 14 domains and does not include
`app.myblue.finance`. Its latest deployment, `dpl_9Ba3zNsxpHELhjkprKv1QNNoGQXR`
(`mybluefinancial-h84d2mor4-myblue.vercel.app`), is READY with source `cli`,
target `null`, no aliases and empty metadata. Inspection requested Git repository
information but returned no Git source or commit binding. READY alone therefore
does not establish that this deployment contains the consolidation candidate or
that production routing is correct. This check did not inspect runtime secrets
or test deployed authentication/provider behavior.

The requested Slack destination was located as public `#banking_war_room`
(`C0C9R654R1P`) in the `brain` workspace, not the MyBlue work workspace.
At inspection it contained only join/invitation messages. The technical update
should link this evidence and PR #4, explicitly retain paused funding and avoid
claiming a production release. No production promotion, main merge, domain
change or provider enablement was performed during this checkpoint.

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


## October 16 continuation — deployed preview and launch blockers

> Technical thread: The banking consolidation remains draft PR #4; the existing
> production hostname serves a separate early-access demo, with account setup
> and fiat funding paused. Alchemy network configuration does not establish
> Coinbase, Robinhood or Kraken on-ramp readiness.

Read-only checks at approximately 00:20 UTC:

- PR #4 is open, draft and mergeable. Its inspected head was
  `76ad3cd40553d92051c68feb6ec6b8ef25001356`; the Vercel commit status
  was successful. This status alone does not establish banking integration tests.
- `app.myblue.finance` belongs to Vercel team `myblue`, project
  `myblue-finance-app` (`prj_3rQds32rTpY3NphUkB1LOgKM6aZE`).
  Production deployment `dpl_AfNV1PJb76BBYeLJ2fSURD3fzhGw` is READY.
  It was created through the CLI and returns no Git commit metadata. Its source
  tree includes banking demo and Increase sandbox files; it is not established
  as the PR #4 source tree.
- The app hostname returns HTTP 308 to `https://myblue.finance/`.
  The apex returns HTTP 200 with “Early access preview”, “Demo balances” and
  “Banking and funding are not yet available.” This corrects the unresolved
  hostname association above; absence from `mybluefinancial` did not imply
  absence from Vercel.
- `GET https://myblue.finance/api/funding` returns HTTP 503, `no-store`,
  `reason: account_setup_paused`, and false authentication, wallet creation
  and funding flags. Coinbase and Robinhood report unavailable. The response
  does not establish a Kraken integration.
- The managed shell could not start commands (exec-server: “No such file or
  directory”), so local source reconciliation and tests could not be rerun.

Release remains blocked on reconciling the deployed CLI source with the reviewed
candidate, selecting the intended app root and canonical auth origin, securely
provisioning and validating shared authentication storage, completing deployed
and human wallet checks, and validating each provider's approved product/API.
The account-setup pause is observed behavior, not a working banking launch.
No merge to main, production promotion, credential change or value transfer was
performed during this continuation. Documentation and the banking war-room
handoff record the actual status.
