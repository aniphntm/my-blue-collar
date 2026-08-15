# MyBluework Sepolia Mobile — Agent Execution Spec

## Product boundary

Build one Expo/React Native app for iOS and Android from the customer wallet at `/wallet`.

- Network: Ethereum Sepolia only (`chainId: 11155111`, `0xaa36a7`).
- Asset: native test ETH only.
- Custody: external user-controlled wallet; never collect or store a seed phrase or private key.
- Geography: jurisdiction-neutral. Do not add Plaid, ACH, routing numbers, USD, cards, lending, tradelines, fiat conversion, or country-specific financial claims.
- Safety: every primary screen and transaction review must say testnet/no real funds.
- Exclusions: mainnet fallback, token selection, swaps, yield, charts, fabricated activity, and WebViews.

The web prototype's Plaid-US, dollar balance, payment, and card controls are not parity requirements; this constraint supersedes them.

## Dependency graph

```text
A Foundation
├── B Native UI and navigation
├── C Sepolia read layer
└── D External-wallet session
    └── E Send test ETH
B + C + D + E ── F Product screens
F ─────────────── G Accessibility and QA
G ─────────────── H iOS/Android preview builds
```

Agents may work concurrently only where the graph permits. Each agent owns its paths until its merge gate passes.

## A — Foundation and contracts

Own: `apps/mobile/package.json`, Expo config, `src/domain/**`.

- Maintain strict TypeScript and iOS/Android identifiers.
- Define wallet session, chain, balance, activity, transaction draft, and transaction status contracts.
- Keep the chain allowlist to Sepolia only.
- Validate `EXPO_PUBLIC_SEPOLIA_RPC_URL`; public RPC URLs may ship, secrets may not.

Gate: clean install and typecheck pass; repository scan finds no mainnet, Plaid, ACH, USD, USDC, card, or private-key feature in `apps/mobile`.

## B — Native UI and navigation

Own: navigation shell, `src/design/**`, primitive components.

- Provide Home, Activity, and Wallet tabs through native navigation.
- Preserve MyBluework tokens: `#f7f8fb`, `#ffffff`, `#151923`, `#171b28`, `#3457f1`.
- Provide testnet banner, cards, buttons, rows, status, loading, empty, and error primitives.
- Support safe areas, Dynamic Type, TalkBack/VoiceOver, reduced motion, and 44pt iOS/48dp Android controls.

Gate: all tabs and primary controls work on both platforms without a WebView or color-only state.

## C — Sepolia data layer

Own: `src/ethereum/**`, queries, unit tests.

- Validate addresses and normalize checksums when a standards library is added.
- Fetch native balance and receipts through JSON-RPC.
- Verify `eth_chainId === 0xaa36a7` before accepting data.
- Represent wei as `bigint` or decimal strings; never JavaScript floating point.
- Model timeout, offline, rate-limit, invalid-response, wrong-chain, and history-unavailable states.
- Do not fabricate transactions if the RPC cannot provide address history.

Gate: tests cover parsing/formatting, wrong-chain rejection, timeouts, zero balance, and receipt states.

## D — External-wallet session

Depends on A. Own: `src/wallet/**` and provider setup.

- Replace the watch-only first slice with a standards-based connector compatible with Expo 57 development builds.
- Support connect, resume, disconnect, account change, chain change, cancellation, expiry, and deep-link return.
- Expose `useWalletSession`, `connect`, `disconnect`, `switchToSepolia`, and external signing/send operations.
- Block signing on any network other than Sepolia.
- Store only connector-approved, non-secret session material.

Gate: iOS and Android development builds connect and recover from rejected, interrupted, expired, and wrong-network sessions without restart.

## E — Send test ETH

Depends on C and D. Own: send routes/features.

Flow: recipient → ETH amount → review network/recipient/amount/estimated fee → approve externally → submitted/pending/confirmed/failed.

- Validate the recipient, positive amount, balance, and fee headroom using decimal-safe bigint logic.
- Disable duplicate submission during approval and broadcast.
- Provide a configurable Sepolia explorer link and copyable hash.
- Never describe confirmation as a real supplier or fiat payment.

Gate: valid Sepolia transfer succeeds; invalid address, insufficient balance, wrong chain, rejection, RPC failure, dropped, and reverted states are explicit.

## F — Product screens

Depends on B–E. Own: Home, Activity, Wallet features.

- Home: live `Available test ETH`, connect/send/refresh/copy actions, plain testnet explanation.
- Activity: pending/confirmed Sepolia items when a provider is available; locale-aware grouping; explicit empty/unavailable states.
- Wallet: address, connection state, Sepolia and chain ID, disconnect, security/help. No bank or card controls.

Gate: disconnected, connecting, connected, wrong-network, loading, empty, offline, and error states all render; every amount includes ETH and every balance is live or explicitly marked fixture.

## G — Accessibility and QA

Depends on F. Own: tests and focused fixes.

- Unit-test domain math and transaction state.
- Integration-test connect/cancel, wrong chain, send review, rejection, confirmation, offline recovery, and disconnect.
- Smoke-test all three tabs and wallet handoff on iOS and Android.
- Audit focus order, labels/hints, live announcements, contrast, large text, keyboard avoidance, safe areas, and foreground return.

Gate: typecheck, tests, Expo diagnostics, VoiceOver, and TalkBack checks pass; secret scans and mainnet/fiat scans are clean.

## H — Preview build handoff

Depends on G. Own: EAS profiles and release notes.

- Produce development/preview builds where credentials permit.
- Document RPC setup, development-build installation, wallet deep-link testing, and provider limits.
- Record Apple/Google signing as an external requirement.
- Do not submit to stores or claim production financial readiness.

Gate: both preview builds start with persistent testnet labeling and reject non-Sepolia sending, or credential-only blockers include exact next commands.

## Current implementation checkpoint

`apps/mobile` implements a safe first slice: three accessible tabs, public-address watch mode, live Sepolia balance reads with chain verification, bigint ETH conversion, explicit unavailable activity, and EIP-681 external-wallet handoff. It does not yet claim authenticated wallet connection, indexed history, receipt tracking, or signed preview builds.
