// Types shared by the send flow. No React Native imports: unit-testable under plain Node.

/** A transaction request handed to the external wallet for approval. Wei is always bigint. */
export interface SendTransactionRequest {
  from: string;
  to: string;
  valueWei: bigint;
}

/**
 * What the send flow needs from the wallet session (provided by `useWalletSession`, unit 2).
 * `sendTransaction` resolves with the transaction hash once the external wallet approved AND
 * broadcast it. It must reject on user rejection (EIP-1193 code 4001 or a "rejected" message)
 * or on a chain mismatch (code 4901/4902 or `SendError.kind === "wrong_chain"`).
 */
export interface SendWalletSession {
  /** Connected account, or null when no wallet session exists. */
  account: string | null;
  /** Chain id the wallet is currently on, or null when unknown. */
  chainId: number | null;
  sendTransaction(request: SendTransactionRequest): Promise<string>;
}

export type FailureKind = "rejected" | "wrong_chain" | "rpc" | "unknown";

/** Optional typed error a session can throw to classify failures explicitly. */
export class SendError extends Error {
  kind: FailureKind;
  constructor(kind: FailureKind, message: string) {
    super(message);
    this.name = "SendError";
    this.kind = kind;
  }
}

export interface FeeEstimate { gas: bigint; gasPriceWei: bigint; feeWei: bigint }

export interface Draft { from: string; to: string; valueWei: bigint }

export interface ReceiptInfo { status: "success" | "reverted"; blockNumber: bigint }
