import type { Draft, FailureKind, FeeEstimate, ReceiptInfo } from "./types.ts";

type Review = { phase: "review"; draft: Draft; balanceWei: bigint; fee: FeeEstimate; recipient: string; amount: string; error: string | null };
type Approving = { phase: "approving"; draft: Draft; balanceWei: bigint; fee: FeeEstimate; recipient: string; amount: string };

export type SendState =
  | { phase: "editing"; recipient: string; amount: string; recipientError: string | null; amountError: string | null; notice: string | null }
  | { phase: "preparing"; recipient: string; amount: string }
  | Review
  | Approving
  | { phase: "submitted"; draft: Draft; hash: string; pollNote: string | null }
  | { phase: "pending"; draft: Draft; hash: string; pollNote: string | null }
  | { phase: "confirmed"; draft: Draft; hash: string; blockNumber: bigint }
  | { phase: "reverted"; draft: Draft; hash: string; blockNumber: bigint }
  | { phase: "dropped"; draft: Draft; hash: string }
  | { phase: "failed"; kind: FailureKind; message: string; back: Review | null };

export type SendAction =
  | { type: "edit"; field: "recipient" | "amount"; value: string }
  | { type: "continue"; recipientError: string | null; amountError: string | null }
  | { type: "prepared"; draft: Draft; balanceWei: bigint; fee: FeeEstimate; fundsError: string | null }
  | { type: "prepare_failed"; message: string }
  | { type: "back" }
  | { type: "approve" }
  | { type: "submitted"; hash: string }
  | { type: "send_failed"; kind: FailureKind; message: string }
  | { type: "poll_pending" }
  | { type: "poll_error"; message: string }
  | { type: "poll_receipt"; receipt: ReceiptInfo }
  | { type: "poll_dropped" }
  | { type: "reset" };

export const initialState: SendState = { phase: "editing", recipient: "", amount: "", recipientError: null, amountError: null, notice: null };

/** True while a second submission must be blocked (preparing, wallet approval, or broadcast not yet settled). */
export function isSubmissionLocked(s: SendState): boolean {
  return s.phase === "approving" || s.phase === "submitted" || s.phase === "pending" || s.phase === "preparing";
}

export function reduce(state: SendState, action: SendAction): SendState {
  switch (action.type) {
    case "edit":
      if (state.phase !== "editing") return state;
      return { ...state, [action.field]: action.value, recipientError: null, amountError: null, notice: null };
    case "continue":
      if (state.phase !== "editing") return state; // duplicate taps while preparing are ignored
      if (action.recipientError || action.amountError) return { ...state, recipientError: action.recipientError, amountError: action.amountError };
      return { phase: "preparing", recipient: state.recipient, amount: state.amount };
    case "prepared":
      if (state.phase !== "preparing") return state;
      return { phase: "review", draft: action.draft, balanceWei: action.balanceWei, fee: action.fee, recipient: state.recipient, amount: state.amount, error: action.fundsError };
    case "prepare_failed":
      if (state.phase !== "preparing") return state;
      return { phase: "editing", recipient: state.recipient, amount: state.amount, recipientError: null, amountError: null, notice: action.message };
    case "back":
      if (state.phase === "review") return { phase: "editing", recipient: state.recipient, amount: state.amount, recipientError: null, amountError: null, notice: null };
      if (state.phase === "failed" && state.back) return { ...state.back, error: null };
      return state;
    case "approve":
      // Only reachable from a review with no blocking error; every other phase is a no-op (duplicate guard).
      if (state.phase !== "review" || state.error) return state;
      return { phase: "approving", draft: state.draft, balanceWei: state.balanceWei, fee: state.fee, recipient: state.recipient, amount: state.amount };
    case "submitted":
      if (state.phase !== "approving") return state;
      return { phase: "submitted", draft: state.draft, hash: action.hash, pollNote: null };
    case "send_failed": {
      if (state.phase !== "approving") return state;
      const back: Review = { phase: "review", draft: state.draft, balanceWei: state.balanceWei, fee: state.fee, recipient: state.recipient, amount: state.amount, error: null };
      return { phase: "failed", kind: action.kind, message: action.message, back };
    }
    case "poll_pending":
      if (state.phase === "submitted" || state.phase === "pending") return { phase: "pending", draft: state.draft, hash: state.hash, pollNote: null };
      return state;
    case "poll_error":
      // An RPC error while polling never changes the outcome: the transaction may still land.
      if (state.phase === "submitted" || state.phase === "pending") return { ...state, pollNote: action.message };
      return state;
    case "poll_receipt":
      if (state.phase !== "submitted" && state.phase !== "pending") return state;
      return action.receipt.status === "success"
        ? { phase: "confirmed", draft: state.draft, hash: state.hash, blockNumber: action.receipt.blockNumber }
        : { phase: "reverted", draft: state.draft, hash: state.hash, blockNumber: action.receipt.blockNumber };
    case "poll_dropped":
      if (state.phase !== "submitted" && state.phase !== "pending") return state;
      return { phase: "dropped", draft: state.draft, hash: state.hash };
    case "reset":
      // Never discard a live approval or an in-flight broadcast.
      if (state.phase === "approving" || state.phase === "submitted" || state.phase === "pending") return state;
      return initialState;
  }
}

/**
 * Pure poll decision. `txKnown` is whether the node still knows the transaction (mempool or mined);
 * `misses` counts consecutive polls where it was unknown. Enough misses means the transaction was dropped.
 */
export const DROP_AFTER_MISSES = 60;
export function decidePoll(input: { receipt: ReceiptInfo | null; txKnown: boolean; misses: number }): { action: SendAction; misses: number } {
  if (input.receipt) return { action: { type: "poll_receipt", receipt: input.receipt }, misses: 0 };
  if (input.txKnown) return { action: { type: "poll_pending" }, misses: 0 };
  const misses = input.misses + 1;
  if (misses >= DROP_AFTER_MISSES) return { action: { type: "poll_dropped" }, misses };
  return { action: { type: "poll_pending" }, misses };
}
