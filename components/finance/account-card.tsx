import { Card, CardEyebrow } from "@/components/ui/card";
import { Amount } from "./amount";
import { formatDate } from "@/lib/finance/format";
import type { Account } from "@/lib/finance/types";

/** One linked account: name, mask, balance, optional available balance and sync time. */
export function AccountCard({ account }: { account: Account }) {
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-4">
        <CardEyebrow>
          {account.institution ? `${account.institution} · ` : ""}
          {account.kind}
        </CardEyebrow>
        {account.mask ? <span className="font-mono text-[11px] text-faint">•••• {account.mask}</span> : null}
      </div>
      <h3 className="mt-4 text-lg font-medium tracking-[-0.02em]">{account.name}</h3>
      <p className="mt-3 text-4xl font-medium tracking-[-0.04em]">
        <Amount money={account.balance} />
      </p>
      <p className="mt-2 text-[13px] text-mut">
        {account.available ? (
          <>
            <Amount money={account.available} /> available
          </>
        ) : (
          "Balance"
        )}
        {account.syncedAt ? ` · synced ${formatDate(account.syncedAt)}` : ""}
      </p>
    </Card>
  );
}
