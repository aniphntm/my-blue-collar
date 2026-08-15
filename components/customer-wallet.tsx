"use client";

import { useMemo, useState } from "react";

type WalletTab = "Wallet" | "Activity" | "Network";
type SendStep = "address" | "amount" | "review" | "handoff";

const walletAddress = "0x71C2A9F412e6B803C5d40D72E4B4A9aBc2687E31";

const transactions = [
  { id: 1, label: "Received", date: "Today · 10:42", amount: "+0.0500 ETH", fee: "Paid by sender", glyph: "↙", status: "Confirmed", hash: "0x81d7…a104" },
  { id: 2, label: "Sent", date: "Yesterday · 16:18", amount: "−0.0125 ETH", fee: "0.00021 ETH", glyph: "↗", status: "Confirmed", hash: "0xa93f…9c12" },
  { id: 3, label: "Received", date: "Aug 12 · 09:05", amount: "+0.1000 ETH", fee: "Paid by sender", glyph: "↙", status: "Confirmed", hash: "0x42bc…07ef" },
];

export function CustomerWallet() {
  const [tab, setTab] = useState<WalletTab>("Wallet");
  const [sendOpen, setSendOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main className="min-h-screen bg-[#f7f8fb] font-sans text-[#151923]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[76px] shrink-0 flex-col items-center border-r border-[#e4e7ec] bg-white py-5 sm:flex">
          <div className="mb-6 grid size-9 place-items-center rounded-[10px] bg-[#3457f1] text-base font-extrabold text-white">B</div>
          <nav aria-label="Wallet navigation" className="flex w-full flex-1 flex-col items-center gap-2">
            {(["Wallet", "Activity", "Network"] as WalletTab[]).map((item) => (
              <button key={item} onClick={() => setTab(item)} className={`flex w-16 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition ${tab === item ? "bg-[#eef1ff] text-[#3457f1]" : "text-[#7b8495] hover:bg-[#f7f8fb] hover:text-[#151923]"}`}>
                <span aria-hidden className="text-lg">{item === "Wallet" ? "◆" : item === "Activity" ? "≡" : "◎"}</span>{item}
              </button>
            ))}
          </nav>
          <div className="size-2 rounded-full bg-[#12b76a]" title="Network connected" />
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-[#e4e7ec] bg-white px-5 py-4 sm:px-7">
            <div><p className="text-[11px] font-semibold uppercase tracking-[.1em] text-[#7b8495]">myblue · account</p><h1 className="mt-0.5 text-lg font-bold tracking-tight">{tab}</h1></div>
            <button onClick={copyAddress} className="flex items-center gap-2 rounded-full border border-[#e4e7ec] bg-[#f7f8fb] py-1.5 pl-1.5 pr-3 font-mono text-xs font-medium hover:bg-[#eef1ff]">
              <span className="size-7 rounded-full bg-gradient-to-br from-[#171b28] to-[#3457f1]" />0x71C2…7E31<span aria-live="polite" className="text-[#7b8495]">{copied ? "Copied" : "⌄"}</span>
            </button>
          </header>
          <div className="flex items-center gap-2 border-b border-[#f5e6b8] bg-[#fff4db] px-5 py-2 text-xs font-semibold text-[#a36100] sm:px-7"><span className="size-1.5 rounded-full bg-[#a36100]" />Testnet · No real funds — Ethereum Sepolia only</div>
          <div className="mx-auto max-w-[760px] p-5 pb-24 sm:p-7 sm:pb-8">
            {tab === "Wallet" ? <WalletHome onCopy={copyAddress} onReceive={() => setReceiveOpen(true)} onSend={() => setSendOpen(true)} /> : null}
            {tab === "Activity" ? <Activity /> : null}
            {tab === "Network" ? <NetworkEconomics /> : null}
          </div>
        </section>
      </div>
      <nav aria-label="Wallet navigation" className="fixed inset-x-0 bottom-0 z-20 flex border-t border-[#e4e7ec] bg-white p-2 sm:hidden">
        {(["Wallet", "Activity", "Network"] as WalletTab[]).map((item) => <button key={item} onClick={() => setTab(item)} className={`flex-1 rounded-lg py-2 text-xs font-semibold ${tab === item ? "bg-[#eef1ff] text-[#3457f1]" : "text-[#667085]"}`}>{item}</button>)}
      </nav>
      {sendOpen ? <SendDialog onClose={() => setSendOpen(false)} /> : null}
      {receiveOpen ? <ReceiveDialog copied={copied} onClose={() => setReceiveOpen(false)} onCopy={copyAddress} /> : null}
    </main>
  );
}

function WalletHome({ onCopy, onReceive, onSend }: { onCopy: () => void; onReceive: () => void; onSend: () => void }) {
  const actions = [{ label: "Send", glyph: "↗", action: onSend }, { label: "Receive", glyph: "↙", action: onReceive }, { label: "Copy", glyph: "⧉", action: onCopy }];
  return <div className="space-y-6">
    <section className="overflow-hidden rounded-[20px] bg-[#171b28] p-7 text-white sm:p-8">
      <div className="flex items-center justify-between"><span className="font-mono text-[11px] font-medium uppercase tracking-[.08em] text-[#9aa4bf]">Sepolia testnet</span><span className="rounded-full border border-white/15 bg-white/[.08] px-2.5 py-1 text-[11px] font-semibold text-[#c8d0df]">Connected</span></div>
      <div className="mt-5 flex items-baseline gap-2"><span className="font-mono text-5xl font-semibold tracking-[-.04em] sm:text-[52px]">0.1375</span><span className="text-lg font-semibold text-[#9aa4bf]">ETH</span></div>
      <p className="mt-2 font-mono text-xs text-[#9aa4bf]">0x71C2…7E31</p>
      <div className="mt-8 grid max-w-sm grid-cols-3 gap-3">{actions.map((item) => <button key={item.label} onClick={item.action} className="group flex flex-col items-center gap-2 text-xs font-semibold"><span className="grid size-12 place-items-center rounded-full bg-white/[.08] text-lg transition group-hover:bg-white/[.16]">{item.glyph}</span>{item.label}</button>)}</div>
    </section>
    <section><p className="mb-2 text-xs font-bold uppercase tracking-[.06em] text-[#7b8495]">Asset</p><div className="flex items-center gap-3 rounded-[14px] border border-[#e4e7ec] bg-white p-4"><span className="grid size-10 place-items-center rounded-full bg-[#eef1ff] font-mono font-bold text-[#3457f1]">Ξ</span><div className="flex-1"><p className="text-sm font-semibold">Ethereum</p><p className="mt-0.5 text-xs text-[#7b8495]">Sepolia · Test network</p></div><div className="text-right"><p className="font-mono text-sm font-semibold">0.1375 ETH</p><p className="mt-0.5 text-[11px] font-semibold text-[#a36100]">No market value</p></div></div></section>
    <section><div className="mb-2 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[.06em] text-[#7b8495]">Recent activity</p><span className="text-xs font-semibold text-[#3457f1]">Last 30 days</span></div><TransactionList items={transactions.slice(0, 2)} /></section>
  </div>;
}

function Activity() {
  const [filter, setFilter] = useState<"All" | "Sent" | "Received">("All");
  const filtered = useMemo(() => filter === "All" ? transactions : transactions.filter((item) => item.label === filter), [filter]);
  return <section><div className="mb-4 flex gap-2">{(["All", "Sent", "Received"] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === item ? "bg-[#171b28] text-white" : "border border-[#d0d5dd] bg-white text-[#667085]"}`}>{item}</button>)}</div><TransactionList items={filtered} showDetails /></section>;
}

function TransactionList({ items, showDetails = false }: { items: typeof transactions; showDetails?: boolean }) {
  return <div className="overflow-hidden rounded-[14px] border border-[#e4e7ec] bg-white">{items.map((item) => <article key={item.id} className="border-b border-[#edf0f4] p-4 last:border-0"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-[#f0f3f9]">{item.glyph}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.label}</p><p className="mt-0.5 text-xs text-[#7b8495]">{item.date}</p></div><div className="text-right"><p className={`font-mono text-sm font-semibold ${item.amount.startsWith("+") ? "text-[#027a48]" : ""}`}>{item.amount}</p><p className="mt-0.5 text-[11px] font-semibold text-[#027a48]">{item.status}</p></div></div>{showDetails ? <div className="ml-12 mt-3 grid grid-cols-2 gap-2 border-t border-[#f2f4f7] pt-3 font-mono text-[11px] text-[#667085]"><span>Network fee</span><span className="text-right text-[#151923]">{item.fee}</span><span>Transaction</span><span className="text-right text-[#151923]">{item.hash}</span></div> : null}</article>)}</div>;
}

function NetworkEconomics() {
  return <div className="space-y-5">
    <section className="rounded-[18px] bg-[#171b28] p-6 text-white sm:p-7"><p className="font-mono text-[11px] uppercase tracking-[.08em] text-[#9aa4bf]">How value moves</p><h2 className="mt-3 max-w-lg text-2xl font-bold tracking-tight">You authorize. The network settles. MyBlue never takes custody.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#aeb7ca]">The same transaction path applies wherever you access the wallet. It depends on the network and your external signer—not a bank account, payment rail, or local currency.</p></section>
    <section className="rounded-[14px] border border-[#e4e7ec] bg-white p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[.06em] text-[#7b8495]">Jurisdiction-neutral flow</p><div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center"><FlowStep number="01" title="Create" body="MyBlue prepares an unsigned transfer." /><span aria-hidden className="hidden text-[#98a2b3] sm:block">→</span><FlowStep number="02" title="Authorize" body="Your external wallet shows and signs it." /><span aria-hidden className="hidden text-[#98a2b3] sm:block">→</span><FlowStep number="03" title="Settle" body="Validators include it in a network block." /></div></section>
    <section className="grid gap-4 sm:grid-cols-2"><EconomicsCard label="Network fee" value="Gas used × gas price" body="Paid in the network asset to validators. MyBlue does not add a transfer fee." /><EconomicsCard label="Final amount" value="Amount + network fee" body="The recipient gets the entered amount; the sender also pays the estimated network fee." /><EconomicsCard label="Fee movement" value="Changes with demand" body="The estimate can move before signing. Your external wallet displays the latest amount." /><EconomicsCard label="Settlement" value="Network-confirmed" body="Transfers are irreversible after confirmation. Names, borders, and banking hours do not route them." /></section>
    <section className="rounded-[14px] border border-[#d6dffb] bg-[#eef1ff] p-5 text-sm leading-6 text-[#344054]"><p className="font-semibold text-[#151923]">Neutral by design, not exempt by design.</p><p className="mt-1">The protocol flow is the same across locations. Your eligibility, obligations, and use of digital assets may still depend on rules that apply to you. MyBlue does not provide legal, tax, or investment advice.</p></section>
  </div>;
}

function FlowStep({ number, title, body }: { number: string; title: string; body: string }) { return <div className="rounded-xl bg-[#f7f8fb] p-4"><span className="font-mono text-[10px] font-semibold text-[#3457f1]">{number}</span><h3 className="mt-2 text-sm font-bold">{title}</h3><p className="mt-1 text-xs leading-5 text-[#667085]">{body}</p></div>; }
function EconomicsCard({ label, value, body }: { label: string; value: string; body: string }) { return <article className="rounded-[14px] border border-[#e4e7ec] bg-white p-5"><p className="text-xs font-semibold text-[#7b8495]">{label}</p><p className="mt-2 font-mono text-sm font-semibold text-[#151923]">{value}</p><p className="mt-2 text-xs leading-5 text-[#667085]">{body}</p></article>; }

function SendDialog({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<SendStep>("address");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const order: SendStep[] = ["address", "amount", "review", "handoff"];
  const stepIndex = order.indexOf(step);
  const next = () => setStep(order[Math.min(stepIndex + 1, order.length - 1)]);
  const back = () => setStep(order[Math.max(stepIndex - 1, 0)]);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#151923]/70 p-5" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="send-title" className="w-full max-w-[420px] rounded-[18px] bg-white p-6 shadow-2xl">
    <div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.08em] text-[#7b8495]">Step {stepIndex + 1} of 4</p><h2 id="send-title" className="mt-1 font-bold">{step === "address" ? "Where are you sending?" : step === "amount" ? "Choose an amount" : step === "review" ? "Review transfer" : "Ready to authorize"}</h2></div><button onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-full text-[#7b8495] hover:bg-[#f2f4f7]">×</button></div>
    {step === "address" ? <label className="mt-6 block text-xs font-semibold text-[#667085]">Recipient address<input autoFocus value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="0x…" className="mt-2 w-full rounded-lg border border-[#d0d5dd] p-3 font-mono text-sm outline-none focus:border-[#3457f1]" /></label> : null}
    {step === "amount" ? <div className="mt-6"><label className="text-xs font-semibold text-[#667085]">Amount</label><div className="mt-2 flex items-center rounded-lg border border-[#d0d5dd] px-3 focus-within:border-[#3457f1]"><input autoFocus inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className="min-w-0 flex-1 py-3 font-mono text-lg outline-none" /><span className="text-sm font-semibold text-[#667085]">ETH</span></div><p className="mt-2 text-xs text-[#7b8495]">Available: 0.1375 ETH</p></div> : null}
    {step === "review" ? <div className="mt-6 divide-y divide-[#f2f4f7] text-sm"><ReviewRow label="Network" value="Ethereum Sepolia" /><ReviewRow label="Recipient" value={recipient ? `${recipient.slice(0, 6)}…${recipient.slice(-4)}` : "0x…"} mono /><ReviewRow label="Amount" value={`${amount || "0.00"} ETH`} mono /><ReviewRow label="Est. network fee" value="0.00021 ETH" mono /><div className="rounded-lg bg-[#fff4db] p-3 text-xs leading-5 text-[#8a4f00]">The fee goes to the network, not MyBlue. Your external wallet will show the current estimate before you sign.</div></div> : null}
    {step === "handoff" ? <div className="py-8 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-[#eef1ff] text-xl text-[#3457f1]">↗</span><p className="mt-4 text-sm font-bold">Transfer prepared</p><p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-[#667085]">Connect an external wallet to inspect and authorize this testnet transaction. MyBlue cannot sign for you.</p></div> : null}
    <div className="mt-6 flex gap-2">{stepIndex > 0 && step !== "handoff" ? <button onClick={back} className="flex-1 rounded-lg border border-[#d0d5dd] px-4 py-2.5 text-sm font-semibold">Back</button> : null}<button disabled={(step === "address" && !recipient.trim()) || (step === "amount" && !amount.trim())} onClick={step === "handoff" ? onClose : next} className="flex-[2] rounded-lg bg-[#3457f1] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{step === "review" ? "Continue to wallet" : step === "handoff" ? "Done" : "Continue"}</button></div>
  </section></div>;
}

function ReviewRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) { return <div className="flex justify-between gap-4 py-3"><span className="text-[#667085]">{label}</span><span className={`text-right font-semibold ${mono ? "font-mono" : ""}`}>{value}</span></div>; }

function ReceiveDialog({ copied, onClose, onCopy }: { copied: boolean; onClose: () => void; onCopy: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#151923]/70 p-5" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="receive-title" className="w-full max-w-[400px] rounded-[18px] bg-white p-6 text-center shadow-2xl"><button onClick={onClose} aria-label="Close" className="ml-auto grid size-8 place-items-center rounded-full text-[#7b8495] hover:bg-[#f2f4f7]">×</button><div className="mx-auto grid size-20 place-items-center rounded-2xl bg-[#eef1ff] font-mono text-3xl font-bold text-[#3457f1]">Ξ</div><h2 id="receive-title" className="mt-5 font-bold">Receive test ETH</h2><p className="mt-2 text-xs leading-5 text-[#667085]">Only send assets supported on Ethereum Sepolia to this address.</p><button onClick={onCopy} className="mt-5 w-full break-all rounded-lg border border-[#d0d5dd] bg-[#f7f8fb] p-3 font-mono text-xs leading-5">{walletAddress}</button><button onClick={onCopy} className="mt-3 w-full rounded-lg bg-[#3457f1] px-4 py-2.5 text-sm font-bold text-white">{copied ? "Address copied" : "Copy address"}</button></section></div>;
}
