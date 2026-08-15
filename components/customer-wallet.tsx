"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePlaidLink } from "react-plaid-link";

type WalletTab = "Home" | "Activity" | "Card & account";
type BankState = "idle" | "opening" | "connected" | "error";

const activity = [
  { name: "Home Depot", detail: "Materials · Today", amount: "−$186.42", status: "Pending", tone: "text-amber-700" },
  { name: "Oak Street Remodel", detail: "Job payment · Today", amount: "+$1,250.00", status: "Arrives tomorrow", tone: "text-blue-700" },
  { name: "Metro Tool Rental", detail: "Equipment · Yesterday", amount: "−$74.00", status: "Paid", tone: "text-emerald-700" },
];

export function CustomerWallet() {
  const [tab, setTab] = useState<WalletTab>("Home");
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [bankState, setBankState] = useState<BankState>("idle");
  const [message, setMessage] = useState("Your wallet is in testnet mode.");
  const [cardFrozen, setCardFrozen] = useState(false);

  const startBankLogin = async () => {
    setBankState("opening");
    setMessage("Preparing secure bank sign-in…");

    try {
      const response = await fetch("/api/plaid/link-token", { method: "POST" });
      const data = (await response.json()) as { linkToken?: string; error?: string };

      if (!response.ok || !data.linkToken) {
        throw new Error(data.error ?? "Bank sign-in is unavailable right now.");
      }

      setLinkToken(data.linkToken);
    } catch (error) {
      setBankState("error");
      setMessage(error instanceof Error ? error.message : "Bank sign-in is unavailable right now.");
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-[#151923]">
      {linkToken ? (
        <PlaidLinkLauncher
          linkToken={linkToken}
          onConnected={() => {
            setLinkToken(null);
            setBankState("connected");
            setMessage("Your bank login is connected for this test session.");
          }}
          onExit={() => {
            setLinkToken(null);
            if (bankState === "opening") {
              setBankState("idle");
              setMessage("Bank sign-in was closed.");
            }
          }}
          onError={(error) => {
            setLinkToken(null);
            setBankState("error");
            setMessage(error);
          }}
        />
      ) : null}

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col lg:flex-row">
        <aside className="hidden w-60 shrink-0 border-r border-[#e4e7ec] bg-white p-5 lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-2">
            <span className="grid size-9 place-items-center rounded-xl bg-[#3457f1] font-black text-white">B</span>
            <div><p className="font-semibold tracking-tight">bluefinancial</p><p className="text-[10px] font-medium uppercase tracking-[.14em] text-[#7b8495]">Test wallet</p></div>
          </div>
          <nav className="mt-10 space-y-1">
            {(["Home", "Activity", "Card & account"] as WalletTab[]).map((item) => (
              <button key={item} onClick={() => setTab(item)} className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${tab === item ? "bg-[#eef1ff] font-semibold text-[#3457f1]" : "text-[#5f6878] hover:bg-[#f6f7f9]"}`}>{item}</button>
            ))}
          </nav>
          <div className="mt-auto rounded-xl bg-[#171b28] p-4 text-white"><p className="text-xs text-[#aeb6c6]">Environment</p><p className="mt-1 text-sm font-semibold">Testnet sandbox</p><p className="mt-3 text-xs leading-5 text-[#aeb6c6]">No real money moves through this wallet.</p></div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-[#e4e7ec] bg-white px-5 py-4 sm:px-8">
            <div><p className="text-xs font-medium uppercase tracking-[.12em] text-[#7b8495]">Testnet</p><h1 className="mt-1 text-lg font-semibold tracking-tight">{tab}</h1></div>
            <span className="rounded-full bg-[#fff4db] px-3 py-1.5 text-xs font-semibold text-[#a36100]">Sandbox</span>
          </header>

          <div className="mx-auto max-w-4xl p-5 pb-24 sm:p-8 lg:pb-8">
            {tab === "Home" ? <Home onBankLogin={startBankLogin} bankState={bankState} message={message} /> : null}
            {tab === "Activity" ? <Activity /> : null}
            {tab === "Card & account" ? <CardAccount cardFrozen={cardFrozen} setCardFrozen={setCardFrozen} onBankLogin={startBankLogin} bankState={bankState} message={message} /> : null}
          </div>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 flex border-t border-[#e4e7ec] bg-white p-2 lg:hidden">
        {(["Home", "Activity", "Card & account"] as WalletTab[]).map((item) => <button key={item} onClick={() => setTab(item)} className={`flex-1 rounded-lg py-2 text-xs font-medium ${tab === item ? "bg-[#eef1ff] text-[#3457f1]" : "text-[#667085]"}`}>{item}</button>)}
      </nav>
    </main>
  );
}

function Home({ onBankLogin, bankState, message }: { onBankLogin: () => void; bankState: BankState; message: string }) {
  return <div className="space-y-5"><section className="rounded-2xl bg-[#171b28] p-6 text-white sm:p-8"><p className="text-sm text-[#bfc7d7]">Available today</p><p className="mt-3 text-5xl font-semibold tracking-[-.06em]">$7,383.08</p><p className="mt-3 text-sm text-[#bfc7d7]">Ready to use for work and everyday spending.</p><button className="mt-7 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#171b28]">Pay supplier</button></section><section className="rounded-2xl border border-[#e3e7ed] bg-white p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-semibold">Your bank</h2><p className="mt-1 max-w-md text-sm leading-6 text-[#667085]">{message}</p></div><button onClick={onBankLogin} disabled={bankState === "opening"} className="rounded-lg bg-[#3457f1] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70">{bankState === "opening" ? "Opening…" : bankState === "connected" ? "Bank connected" : "Login with a bank"}</button></div><p className="mt-4 text-xs leading-5 text-[#7b8495]">Test-only sign-in powered by Plaid Sandbox. Your bank credentials are entered only in Plaid Link.</p></section><Activity compact /></div>;
}

function Activity({ compact = false }: { compact?: boolean }) {
  return <section className="rounded-2xl border border-[#e3e7ed] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">{compact ? "Recent activity" : "Activity"}</h2><p className="mt-1 text-sm text-[#7b8495]">Your work money, in plain language.</p></div>{compact ? <span className="text-sm font-semibold text-[#3457f1]">View all</span> : null}</div><div className="mt-5 divide-y divide-[#edf0f4]">{activity.map((item) => <div className="flex items-center gap-3 py-4" key={item.name}><span className="grid size-10 place-items-center rounded-full bg-[#f0f3f9]">{item.amount.startsWith("+") ? "↓" : "↗"}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.name}</p><p className="mt-0.5 text-xs text-[#7b8495]">{item.detail}</p></div><div className="text-right"><p className="text-sm font-semibold">{item.amount}</p><p className={`mt-0.5 text-xs ${item.tone}`}>{item.status}</p></div></div>)}</div></section>;
}

function CardAccount({ cardFrozen, setCardFrozen, onBankLogin, bankState, message }: { cardFrozen: boolean; setCardFrozen: (value: boolean) => void; onBankLogin: () => void; bankState: BankState; message: string }) {
  return <div className="space-y-5"><section className="rounded-2xl bg-[#171b28] p-6 text-white"><p className="text-sm text-[#bfc7d7]">Your card</p><p className="mt-8 text-2xl tracking-[.18em]">•••• 4821</p><div className="mt-8 flex items-center justify-between"><span className="text-sm">{cardFrozen ? "Card is frozen" : "Card is ready"}</span><button onClick={() => setCardFrozen(!cardFrozen)} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#171b28]">{cardFrozen ? "Unfreeze card" : "Freeze card"}</button></div></section><section className="rounded-2xl border border-[#e3e7ed] bg-white p-5 sm:p-6"><h2 className="font-semibold">Linked bank account</h2><p className="mt-2 text-sm leading-6 text-[#667085]">{message}</p><button onClick={onBankLogin} disabled={bankState === "opening"} className="mt-5 rounded-lg border border-[#cbd5e1] px-4 py-2.5 text-sm font-semibold text-[#3457f1] disabled:cursor-wait disabled:opacity-70">{bankState === "opening" ? "Opening…" : "Login with a bank"}</button></section></div>;
}

function PlaidLinkLauncher({ linkToken, onConnected, onExit, onError }: { linkToken: string; onConnected: () => void; onExit: () => void; onError: (message: string) => void }) {
  const opened = useRef(false);
  const onSuccess = useCallback(async (publicToken: string | null) => {
    if (!publicToken) {
      onError("Bank sign-in did not return a connection token. Please try again.");
      return;
    }
    try {
      const response = await fetch("/api/plaid/exchange", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicToken }) });
      if (!response.ok) throw new Error();
      onConnected();
    } catch {
      onError("Bank sign-in finished, but we could not save this test connection.");
    }
  }, [onConnected, onError]);
  const { open, ready } = usePlaidLink({ token: linkToken, onSuccess, onExit });
  useEffect(() => { if (ready && !opened.current) { opened.current = true; open(); } }, [open, ready]);
  return null;
}
