import { SEPOLIA, fetchSepoliaBalance } from "../ethereum.ts";
import { SendError, type FeeEstimate, type ReceiptInfo } from "./types.ts";

async function call(method: string, params: unknown[]): Promise<unknown> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(SEPOLIA.rpcUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }), signal: controller.signal });
    if (!res.ok) throw new SendError("rpc", "Sepolia is unavailable right now.");
    const body = (await res.json()) as { result?: unknown; error?: { message?: string } };
    if (body.error) throw new SendError("rpc", body.error.message || "Sepolia returned an error.");
    if (body.result === undefined) throw new SendError("rpc", "Sepolia returned an invalid response.");
    return body.result;
  } catch (e) {
    if (e instanceof SendError) throw e;
    if (e instanceof Error && e.name === "AbortError") throw new SendError("rpc", "The Sepolia request timed out.");
    throw new SendError("rpc", "Could not reach Sepolia.");
  } finally { clearTimeout(t); }
}

function hexToBigInt(v: unknown): bigint {
  if (typeof v !== "string" || !/^0x[0-9a-f]+$/i.test(v)) throw new SendError("rpc", "Sepolia returned an invalid number.");
  return BigInt(v);
}

export async function fetchBalance(address: string): Promise<bigint> {
  try { return await fetchSepoliaBalance(address); }
  catch (e) { throw new SendError("rpc", e instanceof Error ? e.message : "Could not read your Sepolia balance."); }
}

export async function estimateFee(from: string, to: string, valueWei: bigint): Promise<FeeEstimate> {
  const [chain, gasRaw, priceRaw] = await Promise.all([
    call("eth_chainId", []),
    call("eth_estimateGas", [{ from, to, value: "0x" + valueWei.toString(16) }]),
    call("eth_gasPrice", []),
  ]);
  if (chain !== SEPOLIA.chainIdHex) throw new SendError("rpc", "The configured RPC is not Ethereum Sepolia.");
  const gas = hexToBigInt(gasRaw);
  const gasPriceWei = hexToBigInt(priceRaw);
  return { gas, gasPriceWei, feeWei: gas * gasPriceWei };
}

/** Returns the receipt (or null) and whether the node still knows the transaction. */
export async function lookupTransaction(hash: string): Promise<{ receipt: ReceiptInfo | null; txKnown: boolean }> {
  const r = (await call("eth_getTransactionReceipt", [hash])) as { status?: string; blockNumber?: string } | null;
  if (r) {
    return { receipt: { status: r.status === "0x1" ? "success" : "reverted", blockNumber: hexToBigInt(r.blockNumber) }, txKnown: true };
  }
  const tx = await call("eth_getTransactionByHash", [hash]);
  return { receipt: null, txKnown: tx !== null };
}
