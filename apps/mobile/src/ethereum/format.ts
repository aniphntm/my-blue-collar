import { SEPOLIA } from "./sepolia.ts";

const ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const ETH_AMOUNT = /^(0|[1-9]\d*)(\.\d{1,18})?$/;

export function isEthereumAddress(value: string): boolean { return ADDRESS.test(value); }
export function shortenAddress(value: string): string { return `${value.slice(0, 6)}…${value.slice(-4)}`; }

export function parseEthToWei(value: string): bigint {
  const normalized = value.trim();
  if (!ETH_AMOUNT.test(normalized)) throw new Error("Enter a positive ETH amount with no more than 18 decimal places.");
  const [whole, fraction = ""] = normalized.split(".");
  const wei = BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, "0"));
  if (wei <= 0n) throw new Error("The ETH amount must be greater than zero.");
  return wei;
}

export function formatEth(wei: bigint): string {
  const whole = wei / 10n ** 18n;
  const fraction = (wei % 10n ** 18n).toString().padStart(18, "0").slice(0, 6).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function buildSepoliaTransferUri(recipient: string, ethAmount: string): string {
  if (!isEthereumAddress(recipient)) throw new Error("The recipient address is invalid.");
  return `ethereum:${recipient}@${SEPOLIA.chainId}?value=${parseEthToWei(ethAmount).toString()}`;
}
