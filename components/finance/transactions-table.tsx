import { Amount } from "./amount";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/finance/format";
import type { Transaction } from "@/lib/finance/types";

/**
 * Transactions as a real table: caption, scoped headers, status in words.
 * Pass an empty array to get the composed empty state.
 */
export function TransactionsTable({
  transactions,
  caption = "Recent activity",
}: {
  transactions: Transaction[];
  caption?: string;
}) {
  if (transactions.length === 0) {
    return (
      <p className="rounded-card border border-border bg-surface p-6 text-[15px] text-mut">
        No activity yet. New transactions appear here once your account syncs.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface">
      <table className="w-full text-left text-[14px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border text-faint">
            <th scope="col" className="eyebrow px-5 py-3 font-medium">Date</th>
            <th scope="col" className="eyebrow px-5 py-3 font-medium">Description</th>
            <th scope="col" className="eyebrow px-5 py-3 font-medium">Status</th>
            <th scope="col" className="eyebrow px-5 py-3 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {transactions.map((t) => (
            <tr key={t.id}>
              <td className="px-5 py-4 text-mut">{formatDate(t.date)}</td>
              <th scope="row" className="px-5 py-4 font-medium">
                {t.description}
                {t.category ? <span className="block text-[13px] font-normal text-mut">{t.category}</span> : null}
              </th>
              <td className="px-5 py-4">
                <StatusBadge status={t.status} />
              </td>
              <td className="px-5 py-4 text-right font-medium">
                <Amount money={t.amount} signed />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
