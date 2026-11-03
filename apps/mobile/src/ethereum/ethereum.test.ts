import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SEPOLIA, SepoliaError, buildSepoliaTransferUri, fetchSepoliaBalance, fetchSepoliaTransactionReceipt,
  formatEth, isEthereumAddress, parseEthToWei, shortenAddress,
} from "./index.ts";
import type { FetchLike } from "./index.ts";

const ADDR = "0x" + "ab".repeat(20);
const HASH = "0x" + "12".repeat(32);

type Handler = (method: string, params: unknown[]) => unknown;
const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
function rpcFetch(handlers: Record<string, Handler | unknown>, calls: string[] = []): FetchLike {
  return async (_url, init) => {
    const { method, params } = JSON.parse(init.body);
    calls.push(method);
    const h = handlers[method];
    const result = typeof h === "function" ? (h as Handler)(method, params) : h;
    return ok({ jsonrpc: "2.0", id: JSON.parse(init.body).id, result });
  };
}
const sepolia = { eth_chainId: SEPOLIA.chainIdHex };
const code = (c: string) => (e: unknown) => e instanceof SepoliaError && e.code === c;

test("parsing and formatting", () => {
  assert.equal(parseEthToWei("1"), 10n ** 18n);
  assert.equal(parseEthToWei(" 0.000000000000000001 "), 1n);
  assert.equal(parseEthToWei("123456789.123456789123456789"), 123456789123456789123456789n);
  for (const bad of ["0", "0.0", "-1", "1.", ".5", "1e3", "01", "1.0000000000000000001", ""]) assert.throws(() => parseEthToWei(bad), undefined, bad);
  assert.equal(formatEth(0n), "0");
  assert.equal(formatEth(10n ** 18n), "1");
  assert.equal(formatEth(1500000000000000000n), "1.5");
  assert.equal(formatEth(1n), "0");
  assert.equal(formatEth(2n ** 100n), "1267650600228.229401");
  assert.ok(isEthereumAddress(ADDR));
  assert.ok(!isEthereumAddress("0x123"));
  assert.equal(shortenAddress(ADDR), "0xabab…abab");
  assert.equal(buildSepoliaTransferUri(ADDR, "0.5"), `ethereum:${ADDR}@11155111?value=500000000000000000`);
  assert.throws(() => buildSepoliaTransferUri("nope", "1"));
});

test("balance: success keeps bigint precision and checks chain first", async () => {
  const calls: string[] = [];
  const wei = await fetchSepoliaBalance(ADDR, { fetch: rpcFetch({ ...sepolia, eth_getBalance: "0xde0b6b3a7640001" }, calls) });
  assert.equal(wei, 0xde0b6b3a7640001n);
  assert.deepEqual(calls, ["eth_chainId", "eth_getBalance"]);
});

test("balance: zero is zero", async () => {
  assert.equal(await fetchSepoliaBalance(ADDR, { fetch: rpcFetch({ ...sepolia, eth_getBalance: "0x0" }) }), 0n);
});

test("balance: wrong chain is rejected before any data is requested", async () => {
  const calls: string[] = [];
  await assert.rejects(fetchSepoliaBalance(ADDR, { fetch: rpcFetch({ eth_chainId: "0x1", eth_getBalance: "0x5" }, calls) }), code("wrong_chain"));
  assert.deepEqual(calls, ["eth_chainId"]);
});

test("balance: invalid address", async () => {
  await assert.rejects(fetchSepoliaBalance("0x1"), code("invalid_input"));
});

test("timeout", async () => {
  const hang: FetchLike = (_u, init) => new Promise((_res, rej) => init.signal.addEventListener("abort", () => rej(Object.assign(new Error("aborted"), { name: "AbortError" }))));
  await assert.rejects(fetchSepoliaBalance(ADDR, { fetch: hang, timeoutMs: 20 }), code("timeout"));
});

test("offline", async () => {
  const f: FetchLike = async () => { throw new TypeError("Network request failed"); };
  await assert.rejects(fetchSepoliaBalance(ADDR, { fetch: f }), code("offline"));
});

test("HTTP 429 and other HTTP failures", async () => {
  await assert.rejects(fetchSepoliaBalance(ADDR, { fetch: async () => ({ ok: false, status: 429, json: async () => ({}) }) }), code("rate_limited"));
  await assert.rejects(fetchSepoliaBalance(ADDR, { fetch: async () => ({ ok: false, status: 503, json: async () => ({}) }) }), code("unavailable"));
});

test("JSON-RPC rate limit error", async () => {
  const f: FetchLike = async () => ok({ jsonrpc: "2.0", id: 1, error: { code: -32005, message: "limit exceeded" } });
  await assert.rejects(fetchSepoliaBalance(ADDR, { fetch: f }), code("rate_limited"));
});

test("malformed JSON and malformed payloads", async () => {
  const badJson: FetchLike = async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError("Unexpected token <"); } });
  await assert.rejects(fetchSepoliaBalance(ADDR, { fetch: badJson }), code("invalid_response"));
  await assert.rejects(fetchSepoliaBalance(ADDR, { fetch: async () => ok("nope") }), code("invalid_response"));
  await assert.rejects(fetchSepoliaBalance(ADDR, { fetch: async () => ok({}) }), code("invalid_response"));
  await assert.rejects(fetchSepoliaBalance(ADDR, { fetch: rpcFetch({ ...sepolia, eth_getBalance: "12" }) }), code("invalid_response"));
  await assert.rejects(fetchSepoliaBalance(ADDR, { fetch: rpcFetch({ ...sepolia, eth_getBalance: 5 }) }), code("invalid_response"));
});

test("receipt: success, reverted", async () => {
  const receipt = (status: string) => ({ transactionHash: HASH, status, blockNumber: "0x10", gasUsed: "0x5208" });
  assert.deepEqual(await fetchSepoliaTransactionReceipt(HASH, { fetch: rpcFetch({ ...sepolia, eth_getTransactionReceipt: receipt("0x1") }) }), { status: "success", blockNumber: 16n, gasUsed: 21000n });
  assert.deepEqual(await fetchSepoliaTransactionReceipt(HASH, { fetch: rpcFetch({ ...sepolia, eth_getTransactionReceipt: receipt("0x0") }) }), { status: "reverted", blockNumber: 16n, gasUsed: 21000n });
});

test("receipt: pending only when node knows the tx; otherwise not_found", async () => {
  const pending = rpcFetch({ ...sepolia, eth_getTransactionReceipt: null, eth_getTransactionByHash: { hash: HASH, blockNumber: null } });
  assert.deepEqual(await fetchSepoliaTransactionReceipt(HASH, { fetch: pending }), { status: "pending" });
  const unknown = rpcFetch({ ...sepolia, eth_getTransactionReceipt: null, eth_getTransactionByHash: null });
  assert.deepEqual(await fetchSepoliaTransactionReceipt(HASH, { fetch: unknown }), { status: "not_found" });
});

test("receipt: invalid hash, wrong chain, mismatched or malformed receipt, history unavailable", async () => {
  await assert.rejects(fetchSepoliaTransactionReceipt("0x12"), code("invalid_input"));
  await assert.rejects(fetchSepoliaTransactionReceipt(HASH, { fetch: rpcFetch({ eth_chainId: "0x1" }) }), code("wrong_chain"));
  const other = { transactionHash: "0x" + "34".repeat(32), status: "0x1", blockNumber: "0x1", gasUsed: "0x1" };
  await assert.rejects(fetchSepoliaTransactionReceipt(HASH, { fetch: rpcFetch({ ...sepolia, eth_getTransactionReceipt: other }) }), code("invalid_response"));
  await assert.rejects(fetchSepoliaTransactionReceipt(HASH, { fetch: rpcFetch({ ...sepolia, eth_getTransactionReceipt: { transactionHash: HASH, blockNumber: "0x1", gasUsed: "0x1" } }) }), code("invalid_response"));
  const pruned: FetchLike = async (_u, init) => {
    const { method } = JSON.parse(init.body);
    return ok(method === "eth_chainId" ? { id: 1, result: SEPOLIA.chainIdHex } : { id: 2, error: { code: -32000, message: "missing trie node (history pruned)" } });
  };
  await assert.rejects(fetchSepoliaTransactionReceipt(HASH, { fetch: pruned }), code("history_unavailable"));
});

test("history-unavailable wording does not leak into balance lookups", async () => {
  const f: FetchLike = async (_u, init) => ok({ id: JSON.parse(init.body).id, error: { code: -32601, message: "method not found" } });
  await assert.rejects(fetchSepoliaBalance(ADDR, { fetch: f }), code("invalid_response"));
});

test("receipt: mined tx without receipt is inconsistent, not pending; mismatched id rejected", async () => {
  const mined = rpcFetch({ ...sepolia, eth_getTransactionReceipt: null, eth_getTransactionByHash: { hash: HASH, blockNumber: "0x5" } });
  await assert.rejects(fetchSepoliaTransactionReceipt(HASH, { fetch: mined }), code("invalid_response"));
  await assert.rejects(fetchSepoliaBalance(ADDR, { fetch: async () => ok({ id: 99, result: SEPOLIA.chainIdHex }) }), code("invalid_response"));
});
