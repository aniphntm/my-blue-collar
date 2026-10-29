import type { Metadata } from "next";
import { AccountCard } from "@/components/finance/account-card";
import { TransactionsTable } from "@/components/finance/transactions-table";
import { Button } from "@/components/ui/button";
import type { Account, FinanceAdapter, Transaction } from "@/lib/finance/types";

export const metadata: Metadata = {
  title: "Finance components — MyBlue Edge",
  robots: { index: false },
};

/** Sample data behind the same adapter interface a real connector implements. */
const sampleAdapter: FinanceAdapter = {
  async listAccounts(): Promise<Account[]> {
    return [
      { id: "a1", name: "Operating", kind: "checking", mask: "4821", institution: "Sample Bank", balance: { amountMinor: 784550, currency: "USD" }, available: { amountMinor: 765908, currency: "USD" }, syncedAt: "2026-10-29" },
      { id: "a2", name: "Tax reserve", kind: "savings", mask: "0097", institution: "Sample Bank", balance: { amountMinor: 312000, currency: "USD" }, syncedAt: "2026-10-29" },
    ];
  },
  async listTransactions(): Promise<Transaction[]> {
    return [
      { id: "t1", description: "Home Depot", category: "Materials", date: "2026-10-29", amount: { amountMinor: -18642, currency: "USD" }, status: "pending" },
      { id: "t2", description: "Oak Street Remodel", category: "Job payment", date: "2026-10-29", amount: { amountMinor: 125000, currency: "USD" }, status: "posted" },
      { id: "t3", description: "Metro Tool Rental", category: "Equipment", date: "2026-10-28", amount: { amountMinor: -7400, currency: "USD" }, status: "posted" },
      { id: "t4", description: "Supplier ACH", category: "Materials", date: "2026-10-27", amount: { amountMinor: -41000, currency: "USD" }, status: "failed" },
    ];
  },
};

export default async function UiPage() {
  const [accounts, transactions] = await Promise.all([
    sampleAdapter.listAccounts(),
    sampleAdapter.listTransactions(),
  ]);
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16">
      <span className="eyebrow text-faint">Example · sample data</span>
      <h1 className="mt-5 text-4xl leading-[1.04] font-medium tracking-[-0.022em] text-balance sm:text-5xl">
        Finance components
      </h1>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {accounts.map((a) => (
          <AccountCard key={a.id} account={a} />
        ))}
      </div>
      <div className="mt-8">
        <TransactionsTable transactions={transactions} />
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-5">
        <Button>Pay supplier</Button>
        <Button variant="secondary" size="sm">Export</Button>
        <Button variant="link">View all →</Button>
      </div>
    </main>
  );
}
