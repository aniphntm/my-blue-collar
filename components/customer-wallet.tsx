"use client";

import { useEffect, useRef, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { LEGAL_NAME_MAX, LEGAL_NAME_MIN, type BankOnboardingView, type MaskedBank } from "@/lib/bank-onboarding";

type WalletTab = "Home" | "Activity" | "Card & account";
type BankState = "idle" | "naming" | "opening" | "verifying" | "verified" | "needs_review" | "rejected" | "error";
type BankView = { state: BankState; message: string; account: MaskedBank | null };
type BankController = {
  view: BankView;
  legalName: string;
  nameInvalid: boolean;
  setLegalName: (value: string) => void;
  begin: () => void;
  submitName: () => void;
};

const IDLE: BankView = { state: "idle", message: "Connect a checking or savings account to get started. Test mode: no real money moves.", account: null };

const REJECTION_COPY: Record<string, string> = {
  ineligible_account: "That account type isn't supported. Choose a checking or savings account.",
  ownership_mismatch: "The name you entered doesn't match the account holder on that bank account.",
  unsupported_ownership: "Business accounts aren't supported yet. Choose a personal checking or savings account.",
};

const activity = [
  { name: "Home Depot", detail: "Materials · Today", amount: "−$186.42", status: "Pending", tone: "text-amber-700" },
  { name: "Oak Street Remodel", detail: "Job payment · Today", amount: "+$1,250.00", status: "Arrives tomorrow", tone: "text-blue-700" },
  { name: "Metro Tool Rental", detail: "Equipment · Yesterday", amount: "−$74.00", status: "Paid", tone: "text-emerald-700" },
];

function describeBank(account: MaskedBank | null) {
  if (!account) return "your bank account";
  return `${account.institutionName ?? "Your bank"}${account.mask ? ` ••${account.mask}` : ""}`;
}

// Maps the server's onboarding outcome to what the customer sees. Provider ids never reach this layer.
function viewFromOutcome(outcome: BankOnboardingView): BankView {
  const account = outcome.bank ?? null;
  switch (outcome.status) {
    case "verified":
      return { state: "verified", account, message: `${describeBank(account)} is verified for this test session. Passkey setup is the next step and isn't available in this test yet.` };
    case "needs_review":
      return { state: "needs_review", account, message: `${describeBank(account)} is linked, but we need to review it before it can be used.` };
    case "rejected":
      return { state: "rejected", account: null, message: REJECTION_COPY[outcome.reason ?? ""] ?? "We couldn't verify that bank account. Try a different one." };
    case "exchanging":
      return { state: "verifying", account: null, message: "Checking that this account is yours…" };
    case "failed":
      return { state: "error", account: null, message: "We couldn't finish connecting your bank. Please try again." };
    default:
      return IDLE;
  }
}

export function CustomerWallet() {
  const [tab, setTab] = useState<WalletTab>("Home");
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [bank, setBank] = useState<BankView>(IDLE);
  const [legalName, setLegalName] = useState("");
  const [nameInvalid, setNameInvalid] = useState(false);
  const [cardFrozen, setCardFrozen] = useState(false);

  // Restore a verified or under-review bank after a refresh; the server answers from the attempt cookie.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/plaid/onboarding")
      .then((response) => (response.ok ? (response.json() as Promise<BankOnboardingView>) : null))
      .then((outcome) => {
        if (!cancelled && outcome && (outcome.status === "verified" || outcome.status === "needs_review")) setBank(viewFromOutcome(outcome));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const fail = (message: string) => {
    setLinkToken(null);
    setBank({ state: "error", message, account: null });
  };

  const submitName = async () => {
    if (legalName.trim().length < LEGAL_NAME_MIN) {
      setNameInvalid(true);
      return;
    }
    setNameInvalid(false);
    setBank({ state: "opening", message: "Preparing secure bank sign-in…", account: null });

    try {
      const response = await fetch("/api/plaid/link-token", { method: "POST" });
      const data = (await response.json()) as { linkToken?: string; error?: string };

      if (!response.ok || !data.linkToken) {
        throw new Error(data.error ?? "Bank sign-in is unavailable right now.");
      }

      setLinkToken(data.linkToken);
    } catch (error) {
      fail(error instanceof Error ? error.message : "Bank sign-in is unavailable right now.");
    }
  };

  const completeLink = async (publicToken: string | null, accountId: string | undefined) => {
    setLinkToken(null);
    if (!publicToken || !accountId) {
      fail("Bank sign-in did not return an account. Please try again.");
      return;
    }
    setBank({ state: "verifying", message: "Checking that this account is yours…", account: null });

    try {
      const response = await fetch("/api/plaid/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicToken, accountId, legalName: legalName.trim() }),
      });
      const data = (await response.json()) as BankOnboardingView & { error?: string };
      if (data.status) setBank(viewFromOutcome(data));
      else fail(data.error ?? "We couldn't finish connecting your bank. Please try again.");
    } catch {
      fail("We couldn't finish connecting your bank. Please try again.");
    }
  };

  const controller: BankController = {
    view: bank,
    legalName,
    nameInvalid,
    setLegalName,
    begin: () => {
      setNameInvalid(false);
      setBank({ state: "naming", message: "Enter your name exactly as it appears on your bank account. We use it only to confirm the account is yours.", account: null });
    },
    submitName,
  };

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-[#151923]">
      {linkToken ? (
        <PlaidLinkLauncher
          linkToken={linkToken}
          onSuccess={completeLink}
          onExit={(message) => {
            setLinkToken(null);
            if (message) fail(message);
            else setBank((current) => (current.state === "opening" ? { state: "idle", message: "Bank sign-in was closed.", account: null } : current));
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
            {tab === "Home" ? <Home bank={controller} /> : null}
            {tab === "Activity" ? <Activity /> : null}
            {tab === "Card & account" ? <CardAccount cardFrozen={cardFrozen} setCardFrozen={setCardFrozen} bank={controller} /> : null}
          </div>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 flex border-t border-[#e4e7ec] bg-white p-2 lg:hidden">
        {(["Home", "Activity", "Card & account"] as WalletTab[]).map((item) => <button key={item} onClick={() => setTab(item)} className={`flex-1 rounded-lg py-2 text-xs font-medium ${tab === item ? "bg-[#eef1ff] text-[#3457f1]" : "text-[#667085]"}`}>{item}</button>)}
      </nav>
    </main>
  );
}

function Home({ bank }: { bank: BankController }) {
  return <div className="space-y-5"><section className="rounded-2xl bg-[#171b28] p-6 text-white sm:p-8"><p className="text-sm text-[#bfc7d7]">Available today</p><p className="mt-3 text-5xl font-semibold tracking-[-.06em]">$7,383.08</p><p className="mt-3 text-sm text-[#bfc7d7]">Ready to use for work and everyday spending.</p><button className="mt-7 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#171b28]">Pay supplier</button></section><section className="rounded-2xl border border-[#e3e7ed] bg-white p-5 sm:p-6"><h2 className="font-semibold">Your bank</h2><BankLink bank={bank} /><p className="mt-4 text-xs leading-5 text-[#7b8495]">Test-only sign-in powered by Plaid Sandbox. Your bank credentials are entered only in Plaid Link.</p></section><Activity compact /></div>;
}

function Activity({ compact = false }: { compact?: boolean }) {
  return <section className="rounded-2xl border border-[#e3e7ed] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">{compact ? "Recent activity" : "Activity"}</h2><p className="mt-1 text-sm text-[#7b8495]">Your work money, in plain language.</p></div>{compact ? <span className="text-sm font-semibold text-[#3457f1]">View all</span> : null}</div><div className="mt-5 divide-y divide-[#edf0f4]">{activity.map((item) => <div className="flex items-center gap-3 py-4" key={item.name}><span className="grid size-10 place-items-center rounded-full bg-[#f0f3f9]">{item.amount.startsWith("+") ? "↓" : "↗"}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.name}</p><p className="mt-0.5 text-xs text-[#7b8495]">{item.detail}</p></div><div className="text-right"><p className="text-sm font-semibold">{item.amount}</p><p className={`mt-0.5 text-xs ${item.tone}`}>{item.status}</p></div></div>)}</div></section>;
}

function CardAccount({ cardFrozen, setCardFrozen, bank }: { cardFrozen: boolean; setCardFrozen: (value: boolean) => void; bank: BankController }) {
  return <div className="space-y-5"><section className="rounded-2xl bg-[#171b28] p-6 text-white"><p className="text-sm text-[#bfc7d7]">Your card</p><p className="mt-8 text-2xl tracking-[.18em]">•••• 4821</p><div className="mt-8 flex items-center justify-between"><span className="text-sm">{cardFrozen ? "Card is frozen" : "Card is ready"}</span><button onClick={() => setCardFrozen(!cardFrozen)} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#171b28]">{cardFrozen ? "Unfreeze card" : "Freeze card"}</button></div></section><section className="rounded-2xl border border-[#e3e7ed] bg-white p-5 sm:p-6"><h2 className="font-semibold">Linked bank account</h2><BankLink bank={bank} /></section></div>;
}

// The one place bank onboarding is presented, so Home and Card & account never drift apart.
function BankLink({ bank }: { bank: BankController }) {
  const { view } = bank;
  const busy = view.state === "opening" || view.state === "verifying";
  const linked = view.state === "verified" || view.state === "needs_review";
  const problem = view.state === "rejected" || view.state === "error";
  return (
    <div className="mt-2">
      <p role={problem ? "alert" : "status"} className={`max-w-md text-sm leading-6 ${problem ? "text-red-700" : "text-[#667085]"}`}>
        {view.message}
      </p>

      {view.state === "naming" ? (
        <form className="mt-4 max-w-md space-y-3" onSubmit={(event) => { event.preventDefault(); bank.submitName(); }}>
          <label className="block text-sm font-medium" htmlFor="bank-legal-name">Full name on the account</label>
          <input
            id="bank-legal-name"
            autoFocus
            autoComplete="name"
            maxLength={LEGAL_NAME_MAX}
            value={bank.legalName}
            onChange={(event) => bank.setLegalName(event.target.value)}
            aria-invalid={bank.nameInvalid}
            aria-describedby={bank.nameInvalid ? "bank-legal-name-error" : undefined}
            className="min-h-11 w-full rounded-lg border border-[#cbd5e1] px-3 text-sm"
          />
          {bank.nameInvalid ? <p id="bank-legal-name-error" role="alert" className="text-sm text-red-700">Enter your full name as it appears on your bank account.</p> : null}
          <button type="submit" className="min-h-11 rounded-lg bg-[#3457f1] px-4 text-sm font-semibold text-white">Continue to bank sign-in</button>
        </form>
      ) : (
        <button
          onClick={bank.begin}
          disabled={busy}
          className={`mt-4 min-h-11 rounded-lg px-4 text-sm font-semibold disabled:cursor-wait disabled:opacity-70 ${linked ? "border border-[#cbd5e1] text-[#3457f1]" : "bg-[#3457f1] text-white"}`}
        >
          {busy ? (view.state === "opening" ? "Opening…" : "Checking…") : linked ? "Use a different bank" : "Login with a bank"}
        </button>
      )}
    </div>
  );
}

function PlaidLinkLauncher({ linkToken, onSuccess, onExit }: {
  linkToken: string;
  onSuccess: (publicToken: string | null, accountId: string | undefined) => void;
  onExit: (errorMessage: string | null) => void;
}) {
  const opened = useRef(false);
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (publicToken, metadata) => onSuccess(publicToken, metadata.accounts[0]?.id),
    onExit: (error) => onExit(error ? error.display_message ?? "Bank sign-in could not be completed. Please try again." : null),
  });
  useEffect(() => { if (ready && !opened.current) { opened.current = true; open(); } }, [open, ready]);
  return null;
}
