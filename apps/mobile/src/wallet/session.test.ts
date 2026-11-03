// @ts-nocheck -- runs under node's built-in test runner; @types/node is intentionally not a dependency.
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseChainId, isAllowedChain } from "../domain/wallet";
import { createWalletController, type ConnectorEvent, type WalletConnector } from "./session";

const ADDR = "0x1111111111111111111111111111111111111111";
const TO = "0x2222222222222222222222222222222222222222";
const HASH = "0x" + "ab".repeat(32);

function fake(overrides: Partial<WalletConnector> = {}) {
  const listeners = new Set<(e: ConnectorEvent) => void>();
  const sent: unknown[] = [];
  const connector: WalletConnector = {
    open: async () => {}, disconnect: async () => {}, switchChain: async () => {},
    sendTransaction: async (tx) => { sent.push(tx); return HASH; },
    subscribe: (l) => { listeners.add(l); return () => listeners.delete(l); },
    ...overrides,
  };
  return { connector, sent, emit: (e: ConnectorEvent) => listeners.forEach((l) => l(e)) };
}

test("chain parsing and allowlist are Sepolia only", () => {
  assert.equal(parseChainId("eip155:11155111"), 11155111);
  assert.equal(parseChainId("0xaa36a7"), 11155111);
  assert.equal(parseChainId("nope"), null);
  assert.ok(isAllowedChain(11155111));
  assert.ok(!isAllowedChain(1));
});

test("not configured: connect reports error and never throws", async () => {
  const c = createWalletController(null);
  assert.equal(c.getSnapshot().configured, false);
  await c.connect();
  const s = c.getSnapshot().state;
  assert.equal(s.status, "error");
  await assert.rejects(c.sendTransaction({ to: TO, valueWei: 1n }), { code: "not-connected" });
});

test("connect then session on Sepolia", async () => {
  const f = fake(); const c = createWalletController(f.connector);
  await c.connect();
  assert.equal(c.getSnapshot().state.status, "connecting");
  f.emit({ type: "session", address: ADDR, chainId: "11155111" });
  assert.deepEqual(c.getSnapshot().state, { status: "connected", address: ADDR, chainId: 11155111 });
});

test("user cancellation (modal closed or wallet reject) returns to disconnected/cancelled", async () => {
  const f = fake(); const c = createWalletController(f.connector);
  await c.connect(); f.emit({ type: "closed" });
  assert.deepEqual(c.getSnapshot().state, { status: "disconnected", reason: "cancelled" });
  const g = fake({ open: async () => { throw { code: 4001, message: "User rejected" }; } });
  const d = createWalletController(g.connector); await d.connect();
  assert.deepEqual(d.getSnapshot().state, { status: "disconnected", reason: "cancelled" });
});

test("closed after a session is established does not cancel", async () => {
  const f = fake(); const c = createWalletController(f.connector);
  await c.connect(); f.emit({ type: "session", address: ADDR, chainId: 11155111 }); f.emit({ type: "closed" });
  assert.equal(c.getSnapshot().state.status, "connected");
});

test("wrong network blocks sending and no request reaches the connector", async () => {
  const f = fake(); const c = createWalletController(f.connector);
  await c.connect(); f.emit({ type: "session", address: ADDR, chainId: 1 });
  assert.equal(c.getSnapshot().state.status, "wrong-network");
  await assert.rejects(c.sendTransaction({ to: TO, valueWei: 1n }), { code: "wrong-network" });
  assert.equal(f.sent.length, 0);
  f.emit({ type: "session", address: ADDR, chainId: 11155111 }); // chain change back
  assert.equal(c.getSnapshot().state.status, "connected");
  f.emit({ type: "session", address: ADDR, chainId: 137 }); // chain change away
  assert.equal(c.getSnapshot().state.status, "wrong-network");
});

test("switchToSepolia: rejection keeps wrong-network with a notice", async () => {
  const f = fake({ switchChain: async () => { throw { code: 4001, message: "rejected" }; } });
  const c = createWalletController(f.connector);
  await c.connect(); f.emit({ type: "session", address: ADDR, chainId: 1 });
  await c.switchToSepolia();
  assert.equal(c.getSnapshot().state.status, "wrong-network");
  assert.equal(c.getSnapshot().notice?.code, "user-rejected");
});

test("account change updates address", async () => {
  const f = fake(); const c = createWalletController(f.connector);
  await c.connect(); f.emit({ type: "session", address: ADDR, chainId: 11155111 });
  f.emit({ type: "session", address: TO, chainId: 11155111 });
  assert.equal((c.getSnapshot().state as { address: string }).address, TO);
});

test("send on Sepolia encodes wei as hex, validates input, and tracks status", async () => {
  const f = fake(); const c = createWalletController(f.connector);
  await c.connect(); f.emit({ type: "session", address: ADDR, chainId: 11155111 });
  await assert.rejects(c.sendTransaction({ to: "bad", valueWei: 1n }), { code: "invalid-request" });
  await assert.rejects(c.sendTransaction({ to: TO, valueWei: 0n }), { code: "invalid-request" });
  const r = await c.sendTransaction({ to: TO, valueWei: 10n ** 18n });
  assert.deepEqual(r, { hash: HASH, status: "submitted" });
  assert.deepEqual(f.sent[0], { from: ADDR, to: TO, value: "0xde0b6b3a7640000", chain: "eip155:11155111" });
  assert.equal(c.getSnapshot().transaction.status, "submitted");
});

test("send rejected by user marks rejected and keeps session", async () => {
  const f = fake({ sendTransaction: async () => { throw { code: 4001, message: "User rejected" }; } });
  const c = createWalletController(f.connector);
  await c.connect(); f.emit({ type: "session", address: ADDR, chainId: 11155111 });
  await assert.rejects(c.sendTransaction({ to: TO, valueWei: 1n }), { code: "user-rejected" });
  assert.equal(c.getSnapshot().transaction.status, "rejected");
  assert.equal(c.getSnapshot().state.status, "connected");
});

test("expiry during send disconnects with reason expired", async () => {
  const f = fake({ sendTransaction: async () => { throw new Error("Session expired"); } });
  const c = createWalletController(f.connector);
  await c.connect(); f.emit({ type: "session", address: ADDR, chainId: 11155111 });
  await assert.rejects(c.sendTransaction({ to: TO, valueWei: 1n }), { code: "expired" });
  assert.deepEqual(c.getSnapshot().state, { status: "disconnected", reason: "expired" });
});

test("invalid hash from wallet is a failure, not success", async () => {
  const f = fake({ sendTransaction: async () => "0x1" });
  const c = createWalletController(f.connector);
  await c.connect(); f.emit({ type: "session", address: ADDR, chainId: 11155111 });
  await assert.rejects(c.sendTransaction({ to: TO, valueWei: 1n }));
  assert.equal(c.getSnapshot().transaction.status, "failed");
});

test("resume: restores a session, or times out to disconnected", async () => {
  const f = fake(); const c = createWalletController(f.connector);
  c.resume(10);
  assert.deepEqual(c.getSnapshot().state, { status: "connecting", resumed: true });
  f.emit({ type: "session", address: ADDR, chainId: 11155111 });
  assert.equal(c.getSnapshot().state.status, "connected");
  const g = fake(); const d = createWalletController(g.connector);
  d.resume(10);
  await new Promise((r) => setTimeout(r, 30));
  assert.deepEqual(d.getSnapshot().state, { status: "disconnected", reason: "initial" });
});

test("remote clear, expiry event, and user disconnect keep their reasons", async () => {
  const f = fake(); const c = createWalletController(f.connector);
  await c.connect(); f.emit({ type: "session", address: ADDR, chainId: 11155111 });
  f.emit({ type: "cleared", reason: "expired" });
  assert.deepEqual(c.getSnapshot().state, { status: "disconnected", reason: "expired" });
  await c.connect(); f.emit({ type: "session", address: ADDR, chainId: 11155111 });
  await c.disconnect(); f.emit({ type: "cleared", reason: "remote" });
  assert.deepEqual(c.getSnapshot().state, { status: "disconnected", reason: "user" });
});
