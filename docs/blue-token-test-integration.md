# MyBlue DeFi tester

- Base mainnet USDC: `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913` (6 decimals); never send mainnet funds into testnet.
- Base Sepolia: use a distinct test USDC address, verified before use.
- $BLUE: Solana mainnet token, not Base USDC. Use a separately minted Solana devnet token for tests.
- Alchemy app `d9znv3crkatwyqzj` serves Base Sepolia and Ethereum Sepolia. Alchemy app `lh6arr2d54y5zlj4` serves Base and Solana mainnet.
- Alpaca supports USDC/USD; BLUE/USD is not available.

## Tester acceptance gates

1. Verify authentic $BLUE mint from issuer records, including mint authority, decimals, supply.
2. Provision a separate Solana devnet RPC and test mint.
3. Show wallet ownership, exact-mint token balance, and wrong-network error states.
4. Sign and confirm devnet-only transfer; check transaction receipt and balances.
5. Run build and automated tests before merging; deploy to a preview environment.

No production transfers, funding, yield, or swaps are enabled by this change.
