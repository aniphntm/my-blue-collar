import { useCallback, useEffect, useReducer, useRef } from "react";
import { estimateFee, fetchBalance, lookupTransaction } from "./chain";
import { decidePoll, initialState, reduce, type SendState } from "./machine";
import { classifyError, chainError, isTxHash, validateAmount, validateFunds, validateRecipient } from "./validation";
import type { SendWalletSession } from "./types";

export const POLL_INTERVAL_MS = 5_000;

/** React glue around the pure reducer. Contains no React Native imports. */
export function useSendFlow(session: SendWalletSession) {
  const [state, dispatch] = useReducer(reduce, initialState);
  const stateRef = useRef<SendState>(state);
  stateRef.current = state;
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const busy = useRef(false); // synchronous duplicate-submission guard (state updates are async)

  const next = useCallback(async () => {
    const s = stateRef.current;
    if (s.phase !== "editing" || busy.current) return;
    const recipientError = validateRecipient(s.recipient);
    const amount = validateAmount(s.amount);
    dispatch({ type: "continue", recipientError, amountError: amount.error });
    if (recipientError || amount.error !== null) return;
    const { account, chainId } = sessionRef.current;
    busy.current = true;
    try {
      if (!account) throw Object.assign(new Error("No wallet is connected."), { code: -1 });
      const wrongChain = chainError(chainId);
      if (wrongChain) { dispatch({ type: "prepare_failed", message: wrongChain }); return; }
      const to = s.recipient.trim();
      const [balanceWei, fee] = await Promise.all([fetchBalance(account), estimateFee(account, to, amount.wei)]);
      const fundsError = validateFunds({ amountWei: amount.wei, balanceWei, feeWei: fee.feeWei });
      dispatch({ type: "prepared", draft: { from: account, to, valueWei: amount.wei }, balanceWei, fee, fundsError });
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      dispatch({ type: "prepare_failed", message: /insufficient funds/i.test(m) ? "Insufficient test ETH for this amount plus the network fee. Lower the amount." : m || "Could not prepare the transaction." });
    } finally { busy.current = false; }
  }, []);

  const approve = useCallback(async () => {
    const s = stateRef.current;
    if (s.phase !== "review" || s.error || busy.current) return;
    busy.current = true;
    dispatch({ type: "approve" });
    try {
      const { account, chainId, sendTransaction } = sessionRef.current;
      const wrongChain = chainError(chainId);
      if (wrongChain) { dispatch({ type: "send_failed", kind: "wrong_chain", message: wrongChain }); return; }
      if (!account || account.toLowerCase() !== s.draft.from.toLowerCase()) {
        dispatch({ type: "send_failed", kind: "unknown", message: "The connected account changed. Review the transaction again." });
        return;
      }
      const hash = await sendTransaction({ from: s.draft.from, to: s.draft.to, valueWei: s.draft.valueWei });
      if (!isTxHash(hash)) {
        dispatch({ type: "send_failed", kind: "unknown", message: "The wallet did not return a transaction hash. Check your wallet's activity before trying again." });
        return;
      }
      dispatch({ type: "submitted", hash });
    } catch (e) {
      const { kind, message } = classifyError(e);
      dispatch({ type: "send_failed", kind, message });
    } finally { busy.current = false; }
  }, []);

  const hash = state.phase === "submitted" || state.phase === "pending" ? state.hash : null;
  useEffect(() => {
    if (!hash) return;
    let cancelled = false;
    let misses = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const r = await lookupTransaction(hash);
        if (cancelled) return;
        const d = decidePoll({ ...r, misses });
        misses = d.misses;
        dispatch(d.action);
        if (d.action.type === "poll_receipt" || d.action.type === "poll_dropped") return;
      } catch (e) {
        if (cancelled) return;
        dispatch({ type: "poll_error", message: e instanceof Error ? e.message : "Could not check the network." });
      }
      timer = setTimeout(tick, POLL_INTERVAL_MS);
    };
    timer = setTimeout(tick, 1_500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [hash]);

  return {
    state,
    edit: (field: "recipient" | "amount", value: string) => dispatch({ type: "edit", field, value }),
    next, approve,
    back: () => dispatch({ type: "back" }),
    reset: () => dispatch({ type: "reset" }),
  };
}
