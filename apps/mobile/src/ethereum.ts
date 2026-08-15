export const SEPOLIA = {
  chainId: 11155111,
  chainIdHex: "0xaa36a7",
  name: "Ethereum Sepolia",
  symbol: "ETH",
  rpcUrl: process.env.EXPO_PUBLIC_SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
} as const;

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

export async function fetchSepoliaBalance(address: string): Promise<bigint> {
  if (!isEthereumAddress(address)) throw new Error("The public Ethereum address is invalid.");
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const chain = await rpc("eth_chainId", [], controller.signal);
    if (chain !== SEPOLIA.chainIdHex) throw new Error("The configured RPC is not Ethereum Sepolia.");
    const value = await rpc("eth_getBalance", [address, "latest"], controller.signal);
    if (typeof value !== "string" || !/^0x[0-9a-f]+$/i.test(value)) throw new Error("Sepolia returned an invalid balance.");
    return BigInt(value);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("The Sepolia request timed out. Try again.");
    throw error;
  } finally { clearTimeout(timeout); }
}

async function rpc(method: string, params: unknown[], signal: AbortSignal): Promise<unknown> {
  const response = await fetch(SEPOLIA.rpcUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }), signal });
  if (!response.ok) throw new Error("Sepolia is unavailable right now.");
  const payload = (await response.json()) as { result?: unknown; error?: { message?: string } };
  if (payload.error || payload.result === undefined) throw new Error(payload.error?.message || "Sepolia returned an invalid response.");
  return payload.result;
}
