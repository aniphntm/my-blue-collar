import { SEPOLIA, isEthereumAddress, parseEthToWei } from "../ethereum.ts";
import { SendError, type FailureKind } from "./types.ts";

/** Fee headroom: the wallet may price the fee above our estimate, so require 150%. */
export const HEADROOM_NUM = 3n;
export const HEADROOM_DEN = 2n;

export function feeWithHeadroom(feeWei: bigint): bigint {
  // Round up so headroom is never under-counted.
  return (feeWei * HEADROOM_NUM + HEADROOM_DEN - 1n) / HEADROOM_DEN;
}

export function validateRecipient(value: string): string | null {
  const v = value.trim();
  if (!v) return "Enter the recipient's public Sepolia address.";
  if (!isEthereumAddress(v)) return "That is not a valid address. It must start with 0x followed by 40 hex characters.";
  return null;
}

export function validateAmount(value: string): { wei: bigint; error: null } | { wei: null; error: string } {
  try { return { wei: parseEthToWei(value), error: null }; }
  catch (e) { return { wei: null, error: e instanceof Error ? e.message : "Enter a valid ETH amount." }; }
}

/** Balance and fee-headroom check. Returns an error message or null. */
export function validateFunds(input: { amountWei: bigint; balanceWei: bigint; feeWei: bigint }): string | null {
  const { amountWei, balanceWei, feeWei } = input;
  if (amountWei <= 0n) return "The ETH amount must be greater than zero.";
  if (amountWei > balanceWei) return "Insufficient test ETH: the amount is more than your balance.";
  if (amountWei + feeWithHeadroom(feeWei) > balanceWei) {
    return "Not enough test ETH left to cover the network fee. Lower the amount.";
  }
  return null;
}

/** Wrong-chain check for the wallet's current chain. */
export function chainError(chainId: number | null): string | null {
  if (chainId === null) return "Your wallet has not reported a network. Reconnect it and try again.";
  if (chainId !== SEPOLIA.chainId) return `Your wallet is on chain ${chainId}. Switch it to ${SEPOLIA.name} (chain ${SEPOLIA.chainId}).`;
  return null;
}

/** Map any thrown error from the wallet session into an explicit failure kind. */
export function classifyError(error: unknown): { kind: FailureKind; message: string } {
  if (error instanceof SendError) return { kind: error.kind, message: error.message };
  const e = error as { code?: unknown; message?: unknown } | null;
  const code = typeof e?.code === "number" ? e.code : undefined;
  const message = typeof e?.message === "string" ? e.message : "";
  if (code === 4001 || code === 5000 || /reject|denied|declin|cancel/i.test(message)) {
    return { kind: "rejected", message: "You rejected the request in your wallet. Nothing was sent." };
  }
  if (/rpc|fetch|network request|timed out|unavailable|-32603|-32000/i.test(message)) {
    return { kind: "rpc", message: "The network could not be reached. Nothing was confirmed; try again in a moment." };
  }
  if (code === 4901 || code === 4902 || /wrong (chain|network)|chain mismatch|unsupported chain|switch (chain|network)|invalid chain/i.test(message)) {
    return { kind: "wrong_chain", message: "Your wallet is on the wrong network. Switch it to Ethereum Sepolia and try again." };
  }
  return { kind: "unknown", message: message || "The wallet returned an unexpected error. Nothing was confirmed." };
}

export const TX_HASH = /^0x[a-fA-F0-9]{64}$/;
export function isTxHash(v: unknown): v is string { return typeof v === "string" && TX_HASH.test(v); }

/** Explorer base is configurable; default is the public Sepolia Etherscan. */
export function explorerTxUrl(hash: string, base?: string): string {
  const root = base || process.env.EXPO_PUBLIC_SEPOLIA_EXPLORER_URL || "https://sepolia.etherscan.io";
  return `${root.replace(/\/+$/, "")}/tx/${hash}`;
}
