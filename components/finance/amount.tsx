import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/finance/format";
import type { Money } from "@/lib/finance/types";

/**
 * A money figure. Tabular numerals, no count-up, and the direction is
 * written ("In" / "Out") for screen readers so sign is never carried by
 * colour alone.
 */
export function Amount({
  money,
  signed = false,
  className,
}: {
  money: Money;
  /** Show "+" for money in and "−" for money out. */
  signed?: boolean;
  className?: string;
}) {
  const out = money.amountMinor < 0;
  const text = formatMoney(money, { absolute: signed });
  return (
    <span className={cn("tabular-nums", className)}>
      {signed ? (
        <>
          <span className="sr-only">{out ? "Out " : "In "}</span>
          <span aria-hidden="true">{out ? "−" : "+"}</span>
        </>
      ) : null}
      {text}
    </span>
  );
}
