export const SEPOLIA = {
  chainId: 11155111,
  chainIdHex: "0xaa36a7",
  name: "Ethereum Sepolia",
  symbol: "ETH",
  rpcUrl: process.env.EXPO_PUBLIC_SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
} as const;
