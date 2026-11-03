import { SEPOLIA, isEthereumAddress } from "../ethereum";

/** Sepolia is the only chain this app may sign or send on. */
export const ALLOWED_CHAINS = [
  { id: SEPOLIA.chainId, hex: SEPOLIA.chainIdHex, caip: `eip155:${SEPOLIA.chainId}`, name: SEPOLIA.name, symbol: SEPOLIA.symbol },
] as const;
export type AllowedChainId = (typeof ALLOWED_CHAINS)[number]["id"];
export const SEPOLIA_CAIP = ALLOWED_CHAINS[0].caip;

export function isAllowedChain(chainId: number | null | undefined): chainId is AllowedChainId {
  return chainId != null && ALLOWED_CHAINS.some((chain) => chain.id === chainId);
}

/** Accepts 11155111, "11155111", "0xaa36a7" or "eip155:11155111". Returns null when unparseable. */
export function parseChainId(input: unknown): number | null {
  let text: string;
  if (typeof input === "number") text = String(input);
  else if (typeof input === "string") text = input.trim();
  else return null;
  if (text.startsWith("eip155:")) text = text.slice("eip155:".length);
  const value = /^0x[0-9a-f]+$/i.test(text) ? Number.parseInt(text, 16) : /^\d+$/.test(text) ? Number(text) : NaN;
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

const ERROR_CODES = [
  "not-configured", "user-rejected", "expired", "wrong-network",
  "invalid-request", "busy", "not-connected", "unavailable", "unknown",
] as const;
export type WalletErrorCode = (typeof ERROR_CODES)[number];
export type WalletError = { code: WalletErrorCode; message: string };

export type DisconnectReason = "initial" | "user" | "cancelled" | "expired" | "remote";

export type WalletState =
  | { status: "disconnected"; reason: DisconnectReason }
  | { status: "connecting"; resumed: boolean }
  | { status: "connected"; address: string; chainId: AllowedChainId }
  | { status: "wrong-network"; address: string; chainId: number | null }
  | { status: "error"; error: WalletError };
export type WalletStatus = WalletState["status"];

export type TransactionStatus = "idle" | "awaiting-signature" | "submitted" | "confirmed" | "failed" | "rejected";
/** Wei is always bigint. */
export type TransactionRequest = { to: string; valueWei: bigint };
export type TransactionState =
  | { status: "idle" | "awaiting-signature" | "rejected" }
  | { status: "submitted" | "confirmed"; hash: string }
  | { status: "failed"; error: WalletError };

export function walletError(code: WalletErrorCode, message: string): WalletError { return { code, message }; }

export function isWalletError(value: unknown): value is WalletError {
  if (typeof value !== "object" || value === null) return false;
  const record = value as { code?: unknown; message?: unknown };
  return typeof record.message === "string" && (ERROR_CODES as readonly unknown[]).includes(record.code);
}

/** Classifies connector/wallet failures (EIP-1193 4001, WalletConnect 5000 and common messages). */
export function classifyWalletError(error: unknown): WalletError {
  if (isWalletError(error)) return error;
  const record = (typeof error === "object" && error !== null ? error : {}) as { code?: unknown; message?: unknown };
  const message = typeof record.message === "string" ? record.message : typeof error === "string" ? error : "";
  const lower = message.toLowerCase();
  if (record.code === 4001 || record.code === 5000 || /user (rejected|denied|declined|cancel)|rejected by (the )?user|request rejected|user closed/.test(lower)) {
    return walletError("user-rejected", "The request was cancelled in your wallet.");
  }
  if (/expired|session.*(deleted|not found|disconnected)|no matching key/.test(lower)) {
    return walletError("expired", "The wallet session expired. Connect again.");
  }
  if (record.code === 4900 || record.code === 4901 || /timeout|timed out|unavailable|offline/.test(lower)) {
    return walletError("unavailable", "The wallet could not be reached. Try again.");
  }
  return walletError("unknown", "The wallet request failed. Try again.");
}

export function validateTransactionRequest(request: TransactionRequest): WalletError | null {
  if (!isEthereumAddress(request.to)) return walletError("invalid-request", "The recipient address is invalid.");
  if (typeof request.valueWei !== "bigint" || request.valueWei <= 0n) {
    return walletError("invalid-request", "The amount must be greater than zero.");
  }
  return null;
}
