/** $BLUE integration: explicit network isolation. No real token exists on devnet unless separately minted. */
export const BLUE_TOKEN = {
  symbol: "BLUE",
  name: "MyBlueCoin",
  network: "solana-mainnet",
  // Supply the verified mainnet mint via deployment configuration, never a guessed address.
  mint: process.env.BLUE_SOLANA_MINT ?? "",
} as const;

export const BLUE_TEST = {
  network: "solana-devnet",
  // Independent test-only mint; never substitute the production mainnet mint.
  mint: process.env.BLUE_DEVNET_MINT ?? "",
} as const;

export function blueNetworkConfig(environment: "test" | "production") {
  const token = environment === "test" ? BLUE_TEST : BLUE_TOKEN;
  if (!token.mint) return { network: token.network, mint: null, configured: false } as const;
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(token.mint)) {
    throw new Error("Invalid BLUE Solana mint address");
  }
  return { network: token.network, mint: token.mint, configured: true } as const;
}
