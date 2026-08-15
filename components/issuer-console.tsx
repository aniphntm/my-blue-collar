"use client";

import { useMemo, useState } from "react";

// Direction: testnet issuer operations console. Alchemy supplies wallet collateral,
// Plaid supplies fiat account linking, and card events are simulations only.
const activitySeed = [
  { merchant: "Atlas Supply Co.", category: "Materials", amount: 186.42, time: "Just now", state: "Authorized" },
  { merchant: "Rivet Coffee", category: "Meals", amount: 8.5, time: "18 min ago", state: "Settled" },
  { merchant: "Metro Tool Rental", category: "Equipment", amount: 74.0, time: "Yesterday", state: "Settled" },
];

const navItems = ["Overview", "Accounts", "Cards", "Authorizations", "Settlements"];

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function IssuerConsole() {
  const [active, setActive] = useState("Overview");
  const [plaidConnected, setPlaidConnected] = useState(false);
  const [cardIssued, setCardIssued] = useState(false);
  const [activities, setActivities] = useState(activitySeed);
  const [notice, setNotice] = useState("Network healthy");

  const pendingHolds = useMemo(
    () => activities.filter((item) => item.state === "Authorized").reduce((total, item) => total + item.amount, 0),
    [activities],
  );
  const available = 4520 + 3325 - pendingHolds - 275;

  function simulateAuthorization() {
    const authorization = { merchant: "Harbor Freight", category: "Tools", amount: 310, time: "Just now", state: "Authorized" };
    setActivities((current) => [authorization, ...current]);
    setNotice("Authorization simulated - $310 hold placed");
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-[#151923]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[248px] shrink-0 flex-col border-r border-[#e4e7ec] bg-white px-4 py-5 lg:flex">
          <div className="flex items-center gap-3 px-3">
            <div className="grid size-8 place-items-center rounded-xl bg-[#3457f1] text-lg font-black text-white">B</div>
            <div><p className="font-semibold tracking-tight">bluework</p><p className="text-[10px] font-medium uppercase tracking-[.14em] text-[#7b8495]">Issuer console</p></div>
          </div>
          <div className="mt-8 px-3 text-[11px] font-semibold uppercase tracking-[.12em] text-[#98a1b2]">Workspace</div>
          <nav className="mt-3 space-y-1">
            {navItems.map((item) => <button key={item} onClick={() => setActive(item)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${active === item ? "bg-[#eef1ff] font-semibold text-[#3457f1]" : "text-[#5f6878] hover:bg-[#f6f7f9]"}`}><span className="grid size-5 place-items-center rounded-md border border-current text-[10px]">{item[0]}</span>{item}</button>)}
          </nav>
          <div className="mt-7 border-t border-[#edf0f3] pt-5">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[.12em] text-[#98a1b2]">Integrations</p>
            <div className="mt-3 space-y-1 text-sm text-[#5f6878]"><p className="flex items-center gap-3 px-3 py-2"><span className="size-2 rounded-full bg-emerald-500" />Alchemy - Sepolia</p><p className="flex items-center gap-3 px-3 py-2"><span className={`size-2 rounded-full ${plaidConnected ? "bg-emerald-500" : "bg-amber-400"}`} />Plaid Sandbox</p></div>
          </div>
          <div className="mt-auto rounded-xl bg-[#171b28] p-4 text-white"><p className="text-xs text-[#aeb6c6]">Environment</p><p className="mt-1 text-sm font-semibold">Testnet sandbox</p><p className="mt-3 text-xs leading-5 text-[#aeb6c6]">No customer funds or live cards are enabled.</p></div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex h-[72px] items-center justify-between border-b border-[#e4e7ec] bg-white px-5 sm:px-8">
            <div><p className="text-sm text-[#7b8495]">{active}</p><h1 className="text-lg font-semibold tracking-tight">Good morning, Animesh</h1></div>
            <div className="flex items-center gap-3"><span className="hidden rounded-full bg-[#ebfaf1] px-3 py-1.5 text-xs font-medium text-[#167347] sm:block">● {notice}</span><button className="grid size-9 place-items-center rounded-full border border-[#e1e5ea] text-[#5f6878]">?</button><div className="grid size-9 place-items-center rounded-full bg-[#e8eefe] text-sm font-semibold text-[#3457f1]">AS</div></div>
          </header>

          <div className="mx-auto max-w-[1440px] p-5 sm:p-8">
            <div className="flex flex-col gap-4 border-b border-[#e4e7ec] pb-7 md:flex-row md:items-end md:justify-between"><div><div className="mb-3 flex items-center gap-2"><span className="rounded bg-[#fff4db] px-2 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#a36100]">Testnet</span><span className="text-xs text-[#7b8495]">Updated seconds ago</span></div><h2 className="text-3xl font-semibold tracking-[-.04em]">Card program overview</h2><p className="mt-2 text-sm text-[#667085]">Crypto-backed spend controls for your field teams.</p></div><button onClick={simulateAuthorization} className="rounded-lg bg-[#3457f1] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2947d5]">+ Simulate authorization</button></div>

            <div className="mt-7 grid gap-5 xl:grid-cols-[1.65fr_1fr]">
              <div className="rounded-2xl border border-[#e3e7ed] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,.03)] sm:p-6">
                <div className="flex items-start justify-between"><div><p className="text-sm font-medium text-[#667085]">Available to spend</p><p className="mt-2 text-4xl font-semibold tracking-[-.05em]">{formatMoney(available)}</p><p className="mt-2 text-xs text-[#667085]">Across 1 active account · USD equivalent</p></div><span className="rounded-lg bg-[#eef1ff] px-3 py-2 text-xs font-semibold text-[#3457f1]">Live formula</span></div>
                <div className="mt-7 grid grid-cols-2 gap-y-5 border-t border-[#edf0f4] pt-5 sm:grid-cols-4"><Metric label="Fiat balance" value="$4,520" /><Metric label="Crypto collateral" value="$3,325" tone="text-[#3457f1]" /><Metric label="Pending holds" value={`−${formatMoney(pendingHolds)}`} /><Metric label="Safety reserve" value="−$275" /></div>
                <div className="mt-7 rounded-xl bg-[#f6f7fc] p-4"><div className="flex items-center justify-between text-xs font-medium"><span>Spend capacity</span><span className="text-[#3457f1]">76% available</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dfe5f4]"><div className="h-full w-[76%] rounded-full bg-[#3457f1]" /></div><p className="mt-3 text-xs leading-5 text-[#667085]">Available spend = fiat balance + eligible collateral − open holds − reserve.</p></div>
              </div>

              <div className="rounded-2xl bg-[#171b28] p-6 text-white shadow-[0_1px_2px_rgba(16,24,40,.12)]"><div className="flex items-center justify-between"><p className="text-sm font-medium text-[#bfc7d7]">Virtual charge card</p><span className="rounded bg-[#2b3449] px-2 py-1 text-[10px] font-bold tracking-[.1em]">SANDBOX</span></div><div className="mt-8 flex items-center justify-between"><div className="grid size-11 place-items-center rounded-lg bg-gradient-to-br from-[#f0c96b] to-[#bd8240] text-[#674117]">◫</div><span className="text-xl tracking-[.18em]">•••• 4821</span></div><p className="mt-9 text-sm font-semibold tracking-[.08em]">BLUEWORK OPERATIONS</p><div className="mt-5 flex items-center justify-between text-xs text-[#bfc7d7]"><span>Daily limit<br /><b className="text-sm text-white">$2,500</b></span><span className="text-right">{cardIssued ? "ACTIVE" : "NOT ISSUED"}<br /><b className="text-sm text-[#8fb0ff]">{cardIssued ? "Ready to test" : "Sandbox only"}</b></span></div><button onClick={() => { setCardIssued(true); setNotice("Virtual card issued in sandbox"); }} className="mt-6 w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-[#171b28]">{cardIssued ? "Card issued" : "Issue virtual card"}</button></div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.65fr_1fr]">
              <div className="rounded-2xl border border-[#e3e7ed] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><div><h3 className="font-semibold tracking-tight">Recent activity</h3><p className="mt-1 text-xs text-[#7b8495]">Authorization and settlement events</p></div><button className="text-sm font-semibold text-[#3457f1]">View all →</button></div><div className="mt-5 divide-y divide-[#edf0f4]">{activities.map((item, index) => <div key={`${item.merchant}-${index}`} className="flex items-center gap-3 py-4"><div className="grid size-10 place-items-center rounded-full bg-[#f0f3f9] text-sm">{item.category === "Tools" ? "⚒" : item.category === "Meals" ? "☕" : "▣"}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.merchant}</p><p className="mt-0.5 text-xs text-[#7b8495]">{item.category} · {item.time}</p></div><div className="text-right"><p className="text-sm font-semibold">{formatMoney(item.amount)}</p><p className={`mt-0.5 text-xs ${item.state === "Authorized" ? "text-[#a36100]" : "text-[#16824a]"}`}>{item.state}</p></div></div>)}</div></div>
              <div className="rounded-2xl border border-[#e3e7ed] bg-white p-5 sm:p-6"><p className="text-sm font-semibold">Connect your rails</p><p className="mt-2 text-sm leading-6 text-[#667085]">Keep fiat account access and on-chain collateral separate, then combine them in the issuer ledger.</p><div className="mt-5 space-y-3"><Rail name="Plaid" description="Link & verify checking account" status={plaidConnected ? "Connected" : "Sandbox"} action={() => { setPlaidConnected(true); setNotice("Plaid Sandbox account connected"); }} actionLabel={plaidConnected ? "Connected" : "Connect"} /><Rail name="Alchemy" description="Read Sepolia collateral wallet" status="Connected" action={() => setNotice("Alchemy wallet balance refreshed")} actionLabel="Refresh" /></div><div className="mt-5 rounded-lg border border-[#f4d9a2] bg-[#fffbf2] p-3 text-xs leading-5 text-[#8a5a0a]">Production requires a sponsor bank, card-network program approval, KYC/AML, custody and risk controls. This console models the product flow only.</div></div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, tone = "text-[#151923]" }: { label: string; value: string; tone?: string }) {
  return <div><p className="text-xs text-[#7b8495]">{label}</p><p className={`mt-1 text-lg font-semibold tracking-tight ${tone}`}>{value}</p></div>;
}

function Rail({ name, description, status, action, actionLabel }: { name: string; description: string; status: string; action: () => void; actionLabel: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-[#e8ebf0] p-3"><div className="grid size-9 place-items-center rounded-lg bg-[#eef1ff] text-sm font-bold text-[#3457f1]">{name[0]}</div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{name}</p><p className="truncate text-xs text-[#7b8495]">{description}</p></div><div className="text-right"><p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#16824a]">● {status}</p><button onClick={action} className="text-xs font-semibold text-[#3457f1]">{actionLabel}</button></div></div>;
}
