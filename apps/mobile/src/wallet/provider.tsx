import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Platform } from "react-native";
import { SEPOLIA_CAIP, isAllowedChain, parseChainId, walletError } from "../domain/wallet";
import {
  WalletControllerContext, createWalletController,
  type ConnectorEvent, type WalletConnector,
} from "./session";

/**
 * Structural view of the hooks exported by `@reown/appkit-react-native` (2.0.x). The module itself is injected by
 * the app (for example `require("@reown/appkit-react-native")` behind a `Platform.OS !== "web"` check) so this file
 * never imports Reown and the web bundle cannot crash on it. The app must also mount `createAppKit(...)`,
 * `<AppKitProvider>` and `<AppKit />` above this provider, with Sepolia as a configured network.
 */
export interface ReownHooks {
  useAccount(): { address?: string; isConnected: boolean; chainId?: string };
  useAppKit(): {
    open(): void | Promise<void>;
    disconnect(): void | Promise<void>;
    switchNetwork(network: string): Promise<void>;
  };
  useProvider(): {
    provider?: {
      request(args: { method: string; params?: unknown[] }, chain?: string): Promise<unknown>;
      on(event: string, listener: (args?: unknown) => void): unknown;
      off(event: string, listener: (args?: unknown) => void): unknown;
    };
  };
  useAppKitState?(): { isOpen: boolean };
}

type BridgeApi = {
  hooks: ReturnType<ReownHooks["useAppKit"]>;
  provider: ReturnType<ReownHooks["useProvider"]>["provider"];
  address?: string;
  chainId?: string;
  isConnected: boolean;
};

export type WalletSessionProviderProps = {
  children: ReactNode;
  /** Defaults to EXPO_PUBLIC_REOWN_PROJECT_ID. A project ID is public, never a secret. */
  projectId?: string;
  reown?: ReownHooks | null;
  resumeTimeoutMs?: number;
};

export function isWalletConfigured(projectId: string | undefined, reown: ReownHooks | null | undefined): boolean {
  return Boolean(projectId?.trim()) && Boolean(reown) && Platform.OS !== "web";
}

export function WalletSessionProvider({ children, projectId = process.env.EXPO_PUBLIC_REOWN_PROJECT_ID, reown, resumeTimeoutMs }: WalletSessionProviderProps) {
  const configured = isWalletConfigured(projectId, reown);
  const apiRef = useRef<BridgeApi | null>(null);

  const { controller, emit } = useMemo(() => {
    // Listener set is local to this controller, so a discarded StrictMode instance never receives events.
    const listeners = new Set<(event: ConnectorEvent) => void>();
    const emit = (event: ConnectorEvent) => listeners.forEach((l) => l(event));
    const api = () => {
      if (!apiRef.current) throw walletError("unavailable", "The wallet is still starting. Try again.");
      return apiRef.current;
    };
    const connector: WalletConnector | null = configured ? {
      async open() { await api().hooks.open(); },
      async disconnect() { await api().hooks.disconnect(); },
      async switchChain(caip) { await api().hooks.switchNetwork(caip); },
      async sendTransaction(tx) {
        const { provider, chainId } = api();
        // Defence in depth: re-check the live chain from the connector, not just our state.
        if (!isAllowedChain(parseChainId(chainId)) || tx.chain !== SEPOLIA_CAIP) {
          throw walletError("wrong-network", "Switch to Ethereum Sepolia before sending.");
        }
        if (!provider) throw walletError("not-connected", "Connect a wallet first.");
        const hash = await provider.request({ method: "eth_sendTransaction", params: [{ from: tx.from, to: tx.to, value: tx.value }] }, tx.chain);
        return hash as string;
      },
      subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    } : null;
    return { controller: createWalletController(connector), emit };
  }, [configured]);

  useEffect(() => { controller.resume(resumeTimeoutMs); }, [controller, resumeTimeoutMs]);

  return (
    <WalletControllerContext.Provider value={controller}>
      {configured && reown ?<ReownBridge reown={reown} apiRef={apiRef} emit={emit} /> : null}
      {children}
    </WalletControllerContext.Provider>
  );
}

/** Renders nothing; mirrors Reown hook state into connector events. Mounted only when configured, so hook order is stable. */
function ReownBridge({ reown, apiRef, emit }: { reown: ReownHooks; apiRef: { current: BridgeApi | null }; emit: (event: ConnectorEvent) => void }) {
  const { address, isConnected, chainId } = reown.useAccount();
  const hooks = reown.useAppKit();
  const { provider } = reown.useProvider();
  const isOpen = reown.useAppKitState?.().isOpen ?? false;
  apiRef.current = { hooks, provider, address, chainId, isConnected };

  const hadSession = useRef(false);
  const connectedRef = useRef(isConnected);
  connectedRef.current = isConnected;

  // Account change, chain change and resume all arrive here as the live account/chain values.
  useEffect(() => {
    if (isConnected && address) { hadSession.current = true; emit({ type: "session", address, chainId }); }
    else if (hadSession.current) { hadSession.current = false; emit({ type: "cleared", reason: "remote" }); }
  }, [address, isConnected, chainId, emit]);

  // Modal dismissed with no session: user cancellation. Debounced so a just-approved session wins the race.
  const wasOpen = useRef(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (wasOpen.current && !isOpen) timer = setTimeout(() => { if (!connectedRef.current) emit({ type: "closed" }); }, 800);
    wasOpen.current = isOpen;
    return () => { if (timer) clearTimeout(timer); };
  }, [isOpen, emit]);

  // Expiry / remote deletion. Event names follow WalletConnect's universal provider; unverified on device.
  useEffect(() => {
    if (!provider) return;
    const expired = () => { hadSession.current = false; emit({ type: "cleared", reason: "expired" }); };
    const remote = () => { hadSession.current = false; emit({ type: "cleared", reason: "remote" }); };
    provider.on("session_expire", expired);
    provider.on("session_delete", remote);
    provider.on("disconnect", remote);
    return () => { provider.off("session_expire", expired); provider.off("session_delete", remote); provider.off("disconnect", remote); };
  }, [provider, emit]);

  return null;
}
