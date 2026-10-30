# MyBluework Wallet

Jurisdiction-neutral, ETH-only Ethereum Sepolia testnet client for iOS and Android.

Status: testnet only, pre-release. This app is not production ready and makes no production financial readiness claim.

## Status

`main` currently ships the watch-only slice (public-address watch mode, Sepolia balance, EIP-681 handoff), which runs in Expo Go via `npm run ios` / `npm run android`. The Reown AppKit session is being delivered through sibling pull requests; the Reown sections and test checklist below apply once those merge. Reown variables have no effect until then.

## Setup

```bash
cd apps/mobile
npm install --ignore-scripts
```

### Environment variables

Both variables are `EXPO_PUBLIC_*`, so they are inlined into the app bundle and visible to anyone who has the app. Treat them as public identifiers only.

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_REOWN_PROJECT_ID` | Reown (WalletConnect) project identifier. Public. Create a project in Reown Cloud (https://cloud.reown.com) and copy its Project ID. Never commit a real value. |
| `EXPO_PUBLIC_SEPOLIA_RPC_URL` | Public Ethereum Sepolia JSON-RPC endpoint. Defaults to `https://rpc.sepolia.org` when unset. |

Set them in an untracked `.env.local` file or in your shell:

```bash
EXPO_PUBLIC_REOWN_PROJECT_ID=<your-reown-project-id>
EXPO_PUBLIC_SEPOLIA_RPC_URL=https://your-public-sepolia-endpoint
```

Never place a secret provider key, private key, or seed phrase in an `EXPO_PUBLIC_*` value. Use an RPC URL that carries no secret, or one restricted by origin or rate limit on the provider side.

## Development build (required for Reown)

Reown's AppKit React Native kit includes native modules and does not run in Expo Go. Use an Expo development build.

Local build (needs Xcode for iOS, Android Studio and a JDK for Android):

```bash
npx expo run:ios
npx expo run:android
```

Cloud build with EAS (`eas.json` defines `development` and `preview` profiles only):

```bash
npm install -g eas-cli
eas login
eas build --profile development --platform ios      # iOS simulator build
eas build --profile development --platform android  # APK
npx expo start --dev-client
```

Prerequisites: the project needs `expo-dev-client` as a dependency (for `developmentClient: true`) and an EAS project ID (`extra.eas.projectId`, created with `eas init`). Neither is added by this change; confirm them when the Reown work lands.

Install the resulting build on a simulator, emulator or device, then run `npx expo start --dev-client` and open the app.

The `preview` profile produces an internally distributed build. Android produces an installable APK. An iOS internal build needs registered test devices and Apple signing (`eas device:create`, then build); it will prompt for credentials:

```bash
eas build --profile preview --platform android
eas build --profile preview --platform ios
```

External requirements (not provided by this repository):

- Apple: an Apple Developer Program account, signing certificates and provisioning profiles are required for any iOS device build (the iOS simulator `development` build does not need them).
- Google: an Android keystore is required to sign builds; EAS can generate and manage one.
- No store submission is configured. There is no `submit` profile.

Note: the Expo 57 documentation (https://docs.expo.dev/versions/v57.0.0/) could not be reached from the authoring environment, so the `eas.json` fields and EAS CLI commands above are not verified against it. Check them before relying on them.

## Checks

```bash
npm run typecheck
npm run scan        # policy and secret scan of app source
npm run doctor      # npx expo-doctor
```

`npm run scan` also checks `.env*` files. It fails if app source contains mainnet, Plaid, ACH, USD/USDC, payment-card, private-key or seed-phrase terms, or hard-coded secrets. Only explicit "never ask for / enter / share a seed phrase or private key" safety copy is allowlisted. There is no automated test runner in this app yet.

## Manual test checklist

Run on both iOS and Android, with an external wallet app that supports WalletConnect set to Ethereum Sepolia. Record device, OS version, wallet app and result for each item.

- [ ] Connect: start a session, approve in the wallet, return to the app; the account and Sepolia network are shown.
- [ ] Reject: reject the proposal in the wallet; the app shows a clear, non-fatal message and can retry.
- [ ] Interrupted: close the wallet or the modal mid-connect, or lose connectivity; the app recovers without a stuck spinner.
- [ ] Expired session: let a session expire or delete it from the wallet; the app shows a disconnected state and offers to reconnect.
- [ ] Wrong network: switch the wallet to another chain; the app blocks sending and prompts to switch to Sepolia.
- [ ] Deep-link return: after approval the wallet returns to the app (scheme `mybluework`) and the session resumes, including from a cold start.
- [ ] Account change: switch accounts in the wallet; the displayed address and balance update.
- [ ] Disconnect: disconnect from the app and from the wallet; session state clears on both sides.
- [ ] VoiceOver (iOS): every control has a label and role, focus order is logical, status changes are announced, testnet labeling is read.
- [ ] TalkBack (Android): same checks as VoiceOver.
- [ ] Persistent testnet labeling is visible on every screen and no real-funds language appears.

## Scope

- Ethereum Sepolia testnet, ETH only
- No mainnet, fiat, card, or key/seed handling; the app never asks for a seed phrase
- No WebView

See `docs/accessibilize/mybluework-sepolia-mobile-spec.md` for the specification and current implementation checkpoint.
