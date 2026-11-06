/**
 * Connector-agnostic finance types. Any source (Plaid, a books/accounting
 * connector, a bank file import) maps its data to these shapes through a
 * FinanceAdapter; the UI never imports a provider SDK.
 */

/** Integer minor units (cents) plus an ISO 4217 code. Never floats. */
export type Money = { amountMinor: number; currency: string };

export type TransactionStatus = "pending" | "posted" | "failed" | "reversed";

export type Transaction = {
  id: string;
  description: string;
  category?: string;
  /** ISO 8601 date or date-time. */
  date: string;
  /** Negative is money out, positive is money in. */
  amount: Money;
  status: TransactionStatus;
  accountId?: string;
};

export type Account = {
  id: string;
  name: string;
  kind: "checking" | "savings" | "card" | "ledger" | "other";
  /** Last four digits, when the source provides them. */
  mask?: string;
  institution?: string;
  balance: Money;
  available?: Money;
  /** ISO 8601 time the source last synced. */
  syncedAt?: string;
};

export interface FinanceAdapter {
  listAccounts(): Promise<Account[]>;
  listTransactions(options?: { accountId?: string; limit?: number }): Promise<Transaction[]>;
}
