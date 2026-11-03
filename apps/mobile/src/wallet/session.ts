import { createContext, useContext, useSyncExternalStore } from "react";
import {
  SEPOLIA_CAIP, classifyWalletError, isAllowedChain, parseChainId, validateTransactionRequest, walletError,
  type DisconnectReason, type TransactionRequest, type TransactionState, type WalletError, type WalletState,
} from "../domain/wallet";
import { SEPOLIA, isEthereumAddress } from "../ethereum";

/* ---------- Pure state machine (no React Native imports) ---------- */

export type WalletEvent =
  | { type: "connect-requested" }
  | { type: "resume-requested" }
  | { type: "resume-timeout" }
  | { type: "session"; address: string | null | undefined; chainId: unknown }
  | { type: "cleared"; reason: DisconnectReason }
  | { type: "failed"; error: WalletError };

export const INITIAL_WALLET_STATE: WalletState = { status: "disconnected", reason: "initial" };

export function walletReducer(state: WalletState, event: WalletEvent): WalletState {
  switch (event.type) {
    case "connect-requested":
      return state.status === "connected" || state.status === "wrong-network" || state.status === "connecting"
        ? state : { status: "connecting", resumed: false };
    case "resume-requested":
      return state.status === "disconnected" && state.reason === "initial" ? { status: "connecting", resumed: true } : state;
    case "resume-timeout":
      return state.status === "connecting" && state.resumed ? INITIAL_WALLET_STATE : state;
    case "session": {
      // A stale event must not revive a session the user just ended; connect() is required first.
      if (state.status === "disconnected" && state.reason === "user") return state;
      if (!event.address) {
        // No account yet: keep waiting while connecting; an established session that loses its account is gone.
        return state.status === "connected" || state.status === "wrong-network"
          ? { status: "disconnected", reason: "remote" } : state;
      }
      if (!isEthereumAddress(event.address)) {
        return { status: "error", error: walletError("unknown", "The wallet returned an invalid account.") };
      }
      const chainId = parseChainId(event.chainId);
      return isAllowedChain(chainId)
        ? { status: "connected", address: event.address, chainId }
        : { status: "wrong-network", address: event.address, chainId };
    }
    case "cleared":
      // Already disconnected: keep the first reason (a user disconnect must not become "remote").
      return state.status === "disconnected" && state.reason !== "initial" ? state : { status: "disconnected", reason: event.reason };
    case "failed":
      if (event.error.code === "user-rejected") {
        return state.status === "connecting" ? { status: "disconnected", reason: "cancelled" } : state;
      }
      if (event.error.code === "expired") return { status: "disconnected", reason: "expired" };
      return state.status === "connecting" ? { status: "error", error: event.error } : state;
  }
}

/* ---------- Connector boundary (implemented with Reown in provider.tsx) ---------- */

export type ConnectorEvent =
  | { type: "session"; address: string | null | undefined; chainId: unknown }
  | { type: "cleared"; reason: DisconnectReason }
  | { type: "closed" }; // connection UI dismissed without a session (user cancellation)

export interface WalletConnector {
  /** Opens the connection UI. Resolution does not imply a session; session events do. */
  open(): Promise<void>;
  disconnect(): Promise<void>;
  /** Asks the wallet to switch to the given CAIP-2 chain id. */
  switchChain(caip: string): Promise<void>;
  /** Sends a native transfer on `chain`; resolves with the transaction hash. */
  sendTransaction(tx: { from: string; to: string; value: string; chain: string }): Promise<string>;
  subscribe(listener: (event: ConnectorEvent) => void): () => void;
}

export type WalletSnapshot = {
  /** False when no Reown project ID or connector is available; connecting is disabled. */
  configured: boolean;
  state: WalletState;
  transaction: TransactionState;
  /** Last non-fatal failure (for example a rejected network switch). Cleared on the next action. */
  notice: WalletError | null;
};

export type SendResult = { hash: string; status: "submitted" };

export interface WalletController {
  getSnapshot(): WalletSnapshot;
  subscribe(listener: () => void): () => void;
  connect(): Promise<void>;
  resume(timeoutMs?: number): void;
  disconnect(): Promise<void>;
  switchToSepolia(): Promise<void>;
  sendTransaction(request: TransactionRequest): Promise<SendResult>;
  dispose(): void;
}

const HASH = /^0x[0-9a-fA-F]{64}$/;

export function createWalletController(connector: WalletConnector | null): WalletController {
  let snapshot: WalletSnapshot = {
    configured: connector !== null, state: INITIAL_WALLET_STATE, transaction: { status: "idle" }, notice: null,
  };
  const listeners = new Set<() => void>();
  let resumeTimer: ReturnType<typeof setTimeout> | undefined;
  const set = (patch: Partial<WalletSnapshot>) => { snapshot = { ...snapshot, ...patch }; listeners.forEach((l) => l()); };
  const dispatch = (event: WalletEvent) => {
    const next = walletReducer(snapshot.state, event);
    if (next === snapshot.state) return;
    set({ state: next });
  };
  const stopResumeTimer = () => { if (resumeTimer) { clearTimeout(resumeTimer); resumeTimer = undefined; } };

  const unsubscribe = connector?.subscribe((event) => {
    if (event.type === "closed") {
      if (snapshot.state.status === "connecting") dispatch({ type: "cleared", reason: "cancelled" });
    } else dispatch(event);
    // Keep the resume timeout armed until the state actually leaves "connecting".
    if (snapshot.state.status !== "connecting") stopResumeTimer();
  });

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },

    async connect() {
      const c = connector;
      if (!c) { set({ state: { status: "error", error: walletError("not-configured", "Wallet connection is not configured.") } }); return; }
      if (snapshot.state.status === "connected" || snapshot.state.status === "wrong-network") return;
      stopResumeTimer();
      set({ notice: null });
      dispatch({ type: "connect-requested" });
      try { await c.open(); }
      catch (error) { dispatch({ type: "failed", error: classifyWalletError(error) }); }
    },

    resume(timeoutMs = 4000) {
      if (!connector) return;
      dispatch({ type: "resume-requested" });
      stopResumeTimer();
      if (snapshot.state.status !== "connecting") return;
      resumeTimer = setTimeout(() => { resumeTimer = undefined; dispatch({ type: "resume-timeout" }); }, timeoutMs);
    },

    async disconnect() {
      stopResumeTimer();
      set({ notice: null });
      // Record the user's intent first so connector-side "cleared" events cannot relabel it as remote.
      dispatch({ type: "cleared", reason: "user" });
      try { await connector?.disconnect(); } catch { /* local state is already cleared */ }
    },

    async switchToSepolia() {
      if (snapshot.state.status !== "wrong-network" || !connector) return;
      set({ notice: null });
      try { await connector.switchChain(SEPOLIA_CAIP); }
      catch (error) {
        const failure = classifyWalletError(error);
        if (failure.code === "expired") dispatch({ type: "failed", error: failure });
        else set({ notice: failure.code === "user-rejected" ? failure : walletError("wrong-network", `Could not switch to ${SEPOLIA.name}. Switch networks in your wallet to continue.`) });
      }
    },

    async sendTransaction(request) {
      const state = snapshot.state;
      // Hard gate: nothing is signed or sent unless the session is connected on Sepolia.
      if (state.status === "wrong-network") throw walletError("wrong-network", `Switch to ${SEPOLIA.name} before sending.`);
      if (state.status !== "connected" || !isAllowedChain(state.chainId) || !connector) {
        throw walletError("not-connected", "Connect a wallet first.");
      }
      const invalid = validateTransactionRequest(request);
      if (invalid) throw invalid;
      if (snapshot.transaction.status === "awaiting-signature") throw walletError("busy", "Another request is waiting in your wallet.");
      set({ transaction: { status: "awaiting-signature" }, notice: null });
      try {
        const hash = await connector.sendTransaction({
          from: state.address, to: request.to, value: `0x${request.valueWei.toString(16)}`, chain: SEPOLIA_CAIP,
        });
        if (typeof hash !== "string" || !HASH.test(hash)) throw walletError("unknown", "The wallet returned an invalid transaction hash.");
        set({ transaction: { status: "submitted", hash } });
        return { hash, status: "submitted" };
      } catch (error) {
        const failure = classifyWalletError(error);
        set({ transaction: failure.code === "user-rejected" ? { status: "rejected" } : { status: "failed", error: failure } });
        if (failure.code === "expired") dispatch({ type: "failed", error: failure });
        throw failure;
      }
    },

    dispose() { stopResumeTimer(); unsubscribe?.(); listeners.clear(); },
  };
}

/* ---------- React hook ---------- */

export const WalletControllerContext = createContext<WalletController | null>(null);

export type WalletSession = WalletSnapshot & {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchToSepolia: () => Promise<void>;
  /** Rejects with a WalletError; never signs unless connected on Sepolia. */
  sendTransaction: (request: TransactionRequest) => Promise<SendResult>;
};

export function useWalletSession(): WalletSession {
  const controller = useContext(WalletControllerContext);
  if (!controller) throw new Error("useWalletSession must be used inside <WalletSessionProvider>.");
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  return {
    ...snapshot,
    connect: controller.connect, disconnect: controller.disconnect,
    switchToSepolia: controller.switchToSepolia, sendTransaction: controller.sendTransaction,
  };
}
