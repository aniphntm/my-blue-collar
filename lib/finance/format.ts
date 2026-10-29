import type { Money } from "./types";

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: string) {
  let f = formatters.get(currency);
  if (!f) {
    f = new Intl.NumberFormat("en-US", { style: "currency", currency });
    formatters.set(currency, f);
  }
  return f;
}

/** Digits of precision for the currency, so JPY (0) and USD (2) both round-trip. */
function fractionDigits(currency: string) {
  return formatter(currency).resolvedOptions().maximumFractionDigits ?? 2;
}

/** "$1,250.00". Sign is added by the caller, in words where it matters. */
export function formatMoney(money: Money, { absolute = false } = {}) {
  const digits = fractionDigits(money.currency);
  const value = money.amountMinor / 10 ** digits;
  return formatter(money.currency).format(absolute ? Math.abs(value) : value);
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso));
}
