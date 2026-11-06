import { cn } from "@/lib/utils";
import type { TransactionStatus } from "@/lib/finance/types";

const labels: Record<TransactionStatus, string> = {
  pending: "Pending",
  posted: "Posted",
  failed: "Failed",
  reversed: "Reversed",
};

/** Status is always the word; the glyph and border only reinforce it. */
export function StatusBadge({ status, className }: { status: TransactionStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px]",
        status === "failed" ? "border-red-600 text-red-600 dark:border-red-400 dark:text-red-400" : "border-border-mid text-mut",
        className,
      )}
    >
      <span aria-hidden="true">{status === "pending" ? "…" : status === "failed" ? "×" : status === "reversed" ? "↺" : "✓"}</span>
      {labels[status]}
    </span>
  );
}
