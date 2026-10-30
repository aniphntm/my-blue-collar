import { SepoliaError } from "./errors.ts";
import { isEthereumAddress } from "./format.ts";
import { SEPOLIA } from "./sepolia.ts";

export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal: AbortSignal }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export interface ReadOptions {
  /** Injectable for tests; defaults to global fetch. */
  fetch?: FetchLike;
  rpcUrl?: string;
  timeoutMs?: number;
}

export type TransactionReceiptResult =
  | { status: "pending" }
  | { status: "not_found" }
  | { status: "success" | "reverted"; blockNumber: bigint; gasUsed: bigint };

const HEX_QUANTITY = /^0x[0-9a-f]+$/i;
const TX_HASH = /^0x[0-9a-fA-F]{64}$/;
const HISTORY_HINT = /pruned|missing trie node|not available|archive|history|method .*(not found|not supported)/i;

export async function fetchSepoliaBalance(address: string, options: ReadOptions = {}): Promise<bigint> {
  if (!isEthereumAddress(address)) throw new SepoliaError("invalid_input");
  return withSession(options, async (call) => {
    const value = await call("eth_getBalance", [address, "latest"]);
    if (typeof value !== "string" || !HEX_QUANTITY.test(value)) throw new SepoliaError("invalid_response", "Sepolia returned an invalid balance.");
    return BigInt(value);
  });
}

/**
 * Looks up a transaction. Never invents data: a hash the node does not know is
 * reported as "not_found", and "pending" is only returned when the node
 * itself knows the transaction but has no receipt yet.
 */
export async function fetchSepoliaTransactionReceipt(hash: string, options: ReadOptions = {}): Promise<TransactionReceiptResult> {
  if (!TX_HASH.test(hash)) throw new SepoliaError("invalid_input", "The transaction hash is invalid.");
  return withSession(options, async (call): Promise<TransactionReceiptResult> => {
    const receipt = await call("eth_getTransactionReceipt", [hash]);
    if (receipt === null) {
      const tx = await call("eth_getTransactionByHash", [hash]);
      if (tx === null) return { status: "not_found" };
      if (!isRecord(tx) || typeof tx.hash !== "string" || tx.hash.toLowerCase() !== hash.toLowerCase()) throw new SepoliaError("invalid_response");
      // A transaction already in a block must have a receipt; do not report it as pending.
      if (tx.blockNumber !== null && tx.blockNumber !== undefined) throw new SepoliaError("invalid_response");
      return { status: "pending" };
    }
    if (!isRecord(receipt)) throw new SepoliaError("invalid_response");
    const { status, blockNumber, gasUsed, transactionHash } = receipt;
    if (typeof transactionHash !== "string" || transactionHash.toLowerCase() !== hash.toLowerCase()) throw new SepoliaError("invalid_response");
    if (!isQuantity(blockNumber) || !isQuantity(gasUsed)) throw new SepoliaError("invalid_response");
    if (status !== "0x1" && status !== "0x0") throw new SepoliaError("invalid_response");
    return { status: status === "0x1" ? "success" : "reverted", blockNumber: BigInt(blockNumber), gasUsed: BigInt(gasUsed) };
  });
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function isQuantity(value: unknown): value is string { return typeof value === "string" && HEX_QUANTITY.test(value); }

type Call = (method: string, params: unknown[]) => Promise<unknown>;

/** Runs `work` under one timeout, after verifying eth_chainId is Sepolia. */
async function withSession<T>(options: ReadOptions, work: (call: Call) => Promise<T>): Promise<T> {
  const doFetch = options.fetch ?? (globalThis.fetch as unknown as FetchLike);
  const url = options.rpcUrl ?? SEPOLIA.rpcUrl;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 12_000);
  let nextId = 1;
  const call: Call = async (method, params) => {
    const id = nextId++;
    let response;
    try {
      response = await doFetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id, method, params }), signal: controller.signal });
    } catch (error) {
      if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) throw new SepoliaError("timeout");
      throw new SepoliaError("offline");
    }
    if (response.status === 429) throw new SepoliaError("rate_limited");
    if (!response.ok) throw new SepoliaError("unavailable");
    let payload: unknown;
    try { payload = await response.json(); } catch {
      if (controller.signal.aborted) throw new SepoliaError("timeout");
      throw new SepoliaError("invalid_response");
    }
    if (!isRecord(payload)) throw new SepoliaError("invalid_response");
    if (payload.id !== id) throw new SepoliaError("invalid_response");
    if (isRecord(payload.error)) {
      const message = typeof payload.error.message === "string" ? payload.error.message : "";
      if (payload.error.code === 429 || payload.error.code === -32005 || /rate.?limit|too many requests/i.test(message)) throw new SepoliaError("rate_limited");
      const isHistoryCall = method === "eth_getTransactionReceipt" || method === "eth_getTransactionByHash";
      if (isHistoryCall && (payload.error.code === -32601 || HISTORY_HINT.test(message))) throw new SepoliaError("history_unavailable");
      throw new SepoliaError("invalid_response", message || undefined);
    }
    if (!("result" in payload) || payload.result === undefined) throw new SepoliaError("invalid_response");
    return payload.result;
  };
  try {
    const chain = await call("eth_chainId", []);
    if (typeof chain !== "string" || chain.toLowerCase() !== SEPOLIA.chainIdHex) throw new SepoliaError("wrong_chain");
    return await work(call);
  } finally { clearTimeout(timeout); }
}
