export const BASE_WALLET_CHAIN_ID = 8453 as const;
export const BASE_WALLET_CAIP_NETWORK_ID = "eip155:8453" as const;

export type WalletConnectionStatus =
  | "unconfigured"
  | "loading"
  | "disconnected"
  | "connecting"
  | "connected"
  | "wrong_chain"
  | "error";

export type WalletConnectionSnapshot = {
  address: `0x${string}` | null;
  chainId: number | null;
  error: string | null;
  status: WalletConnectionStatus;
};

export const INITIAL_WALLET_CONNECTION: WalletConnectionSnapshot = {
  address: null,
  chainId: null,
  error: null,
  status: "loading",
};

export function shortenEvmAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
