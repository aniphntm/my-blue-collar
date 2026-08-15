# MyBluework Wallet

Jurisdiction-neutral, ETH-only Ethereum Sepolia testnet client for iOS and Android.

## Run

```bash
npm install --ignore-scripts
npm run ios
# or
npm run android
```

The app defaults to `https://rpc.sepolia.org`. To use another public Sepolia endpoint:

```bash
EXPO_PUBLIC_SEPOLIA_RPC_URL=https://your-public-sepolia-endpoint npm start
```

Never place a secret provider key, private key, or seed phrase in an `EXPO_PUBLIC_*` value.

## Current scope

- Public-address watch mode
- Live Sepolia ETH balance with chain-ID verification
- ETH-only bigint amount handling
- External-wallet EIP-681 transaction handoff
- Persistent testnet/no-real-funds messaging

WalletConnect/SIWE sessions, indexed history, receipt tracking, tests, and signed preview builds are specified in `docs/accessibilize/mybluework-sepolia-mobile-spec.md` for dependent agents.
