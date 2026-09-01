"use client";

import type { AppKit } from "@reown/appkit/core";
import { useEffect, useState } from "react";

import {
  BASE_WALLET_CHAIN_ID,
  INITIAL_WALLET_CONNECTION,
  shortenEvmAddress,
  type WalletConnectionSnapshot,
} from "@/lib/wallet/beta-wallet-contract";

type BetaWalletRuntime = {
  appKit: AppKit;
  baseNetwork: Parameters<AppKit["switchNetwork"]>[0];
};

const reownProjectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID?.trim();
let betaWalletRuntimePromise: Promise<BetaWalletRuntime> | null = null;

function getBetaWalletRuntime() {
  if (!reownProjectId) {
    return Promise.reject(new Error("WalletConnect is not configured for this build."));
  }

  betaWalletRuntimePromise ??= Promise.all([
    import("@reown/appkit/core"),
    import("@reown/appkit-adapter-wagmi"),
    import("@reown/appkit/networks"),
  ]).then(([{ createAppKit }, { WagmiAdapter }, { base }]) => {
    const appUrl =
      process.env.NEXT_PUBLIC_WALLET_APP_URL?.trim() || window.location.origin;
    const wagmiAdapter = new WagmiAdapter({
      networks: [base],
      pendingTransactionsFilter: { enable: false },
      projectId: reownProjectId,
    });

    const appKit = createAppKit({
      adapters: [wagmiAdapter],
      allowUnsupportedChain: false,
      defaultAccountTypes: { eip155: "eoa" },
      defaultNetwork: base,
      enableBaseAccount: false,
      enableCoinbase: false,
      enableEIP6963: false,
      enableInjected: false,
      enableReconnect: false,
      features: {
        allWallets: true,
        analytics: false,
        email: false,
        history: false,
        onramp: false,
        pay: false,
        receive: false,
        reownAuthentication: false,
        send: false,
        smartSessions: false,
        socials: false,
        swaps: false,
      },
      metadata: {
        description: "Connection-only wallet beta. MyBleuMoney cannot move funds.",
        icons: [`${appUrl}/favicon.ico`],
        name: "MyBleuMoney Beta",
        url: appUrl,
      },
      networks: [base],
      projectId: reownProjectId,
      themeMode: "light",
    });

    // AppKit 1.8.x does not consistently propagate this constructor option.
    // Reapply it before readiness so the beta cannot expose Base Account rails.
    appKit.updateOptions({ enableBaseAccount: false });

    return appKit.ready().then(() => ({ appKit, baseNetwork: base }));
  });

  return betaWalletRuntimePromise;
}

function accountSnapshot(
  account: ReturnType<AppKit["getAccount"]>,
  chainId: string | number | undefined,
): WalletConnectionSnapshot {
  const normalizedChainId = chainId === undefined ? null : Number(chainId);
  if (!account) {
    return {
      address: null,
      chainId: normalizedChainId,
      error: null,
      status: "disconnected",
    };
  }

  const address = account.address?.startsWith("0x")
    ? (account.address as `0x${string}`)
    : null;

  if (!account.isConnected) {
    return {
      address,
      chainId: normalizedChainId,
      error: null,
      status:
        account.status === "connecting" || account.status === "reconnecting"
          ? "connecting"
          : "disconnected",
    };
  }

  return {
    address,
    chainId: normalizedChainId,
    error: null,
    status:
      normalizedChainId === BASE_WALLET_CHAIN_ID
        ? "connected"
        : "wrong_chain",
  };
}

export function WalletConnectBeta() {
  const [wallet, setWallet] = useState<WalletConnectionSnapshot>(() =>
    reownProjectId
      ? INITIAL_WALLET_CONNECTION
      : {
          address: null,
          chainId: null,
          error: null,
          status: "unconfigured",
        },
  );
  const [runtime, setRuntime] = useState<BetaWalletRuntime | null>(null);

  useEffect(() => {
    if (!reownProjectId) return;

    let active = true;
    let unsubscribeAccount = () => {};
    let unsubscribeNetwork = () => {};

    void getBetaWalletRuntime()
      .then((nextRuntime) => {
        if (!active) return;

        setRuntime(nextRuntime);
        const sync = () => {
          if (!active) return;
          setWallet(
            accountSnapshot(
              nextRuntime.appKit.getAccount("eip155"),
              nextRuntime.appKit.getChainId(),
            ),
          );
        };

        sync();
        unsubscribeAccount = nextRuntime.appKit.subscribeAccount(sync, "eip155");
        unsubscribeNetwork = nextRuntime.appKit.subscribeNetwork(sync);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setWallet({
          address: null,
          chainId: null,
          error:
            error instanceof Error
              ? error.message
              : "WalletConnect could not initialize.",
          status: "error",
        });
      });

    return () => {
      active = false;
      unsubscribeAccount();
      unsubscribeNetwork();
    };
  }, []);

  const connect = async () => {
    if (!runtime) return;
    try {
      await runtime.appKit.open({ view: "Connect" });
    } catch (error) {
      setWallet((current) => ({
        ...current,
        error: error instanceof Error ? error.message : "WalletConnect could not open.",
        status: "error",
      }));
    }
  };

  const switchToBase = async () => {
    if (!runtime) return;
    try {
      await runtime.appKit.switchNetwork(runtime.baseNetwork, {
        throwOnFailure: true,
      });
    } catch (error) {
      setWallet((current) => ({
        ...current,
        error:
          error instanceof Error
            ? error.message
            : "Your wallet did not switch to Base.",
      }));
    }
  };

  const disconnect = async () => {
    if (!runtime) return;
    try {
      await runtime.appKit.disconnect("eip155");
    } catch (error) {
      setWallet((current) => ({
        ...current,
        error:
          error instanceof Error
            ? error.message
            : "WalletConnect could not disconnect.",
      }));
    }
  };

  const action =
    wallet.status === "wrong_chain"
      ? { label: "Switch to Base", run: switchToBase }
      : wallet.status === "connected"
        ? { label: "Disconnect", run: disconnect }
        : { label: "Connect wallet", run: connect };
  const actionDisabled =
    wallet.status === "loading" ||
    wallet.status === "connecting" ||
    wallet.status === "unconfigured" ||
    !runtime;

  return (
    <section
      aria-labelledby="wallet-connect-beta-title"
      className="border-b border-[#d6dffb] bg-[#eef1ff] px-5 py-4 text-[#151923] sm:px-7"
    >
      <div className="mx-auto flex max-w-[960px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="wallet-connect-beta-title" className="text-sm font-bold">
              WalletConnect beta
            </h2>
            <span className="rounded-full bg-white px-2 py-1 font-mono text-[10px] font-semibold text-[#3457f1]">
              Base · 8453
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-[#475467]">
            Connection only. This beta cannot deposit, send, sign, or move funds.
          </p>
          {wallet.address ? (
            <p className="mt-1 font-mono text-xs text-[#344054]">
              {shortenEvmAddress(wallet.address)}
              {wallet.status === "wrong_chain"
                ? ` · Unsupported chain ${wallet.chainId ?? "unknown"}`
                : " · Base connected"}
            </p>
          ) : null}
          {wallet.status === "unconfigured" ? (
            <p className="mt-1 text-xs font-semibold text-[#a36100]">
              Configuration required before testers can connect.
            </p>
          ) : null}
          {wallet.error ? (
            <p aria-live="polite" className="mt-1 text-xs font-semibold text-[#b42318]">
              {wallet.error}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void action.run()}
          disabled={actionDisabled}
          className="shrink-0 rounded-lg bg-[#3457f1] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#2945c7] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {wallet.status === "loading"
            ? "Loading…"
            : wallet.status === "connecting"
              ? "Connecting…"
              : action.label}
        </button>
      </div>
    </section>
  );
}
