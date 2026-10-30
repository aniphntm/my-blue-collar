import assert from "node:assert/strict";
import { test } from "node:test";
import { DROP_AFTER_MISSES, decidePoll, initialState, isSubmissionLocked, reduce, type SendAction, type SendState } from "./machine.ts";
import { SendError } from "./types.ts";
import { chainError, classifyError, explorerTxUrl, feeWithHeadroom, isTxHash, validateAmount, validateFunds, validateRecipient } from "./validation.ts";

const ADDR = "0x" + "a".repeat(40);
const HASH = "0x" + "b".repeat(64);
const draft = { from: ADDR, to: "0x" + "c".repeat(40), valueWei: 10n ** 15n };
const fee = { gas: 21000n, gasPriceWei: 10n ** 9n, feeWei: 21000n * 10n ** 9n };
const run = (actions: SendAction[], from: SendState = initialState) => actions.reduce(reduce, from);
const toReview = () => run([
  { type: "edit", field: "recipient", value: draft.to }, { type: "edit", field: "amount", value: "0.001" },
  { type: "continue", recipientError: null, amountError: null },
  { type: "prepared", draft, balanceWei: 10n ** 18n, fee, fundsError: null },
]);

test("invalid recipient", () => {
  assert.ok(validateRecipient(""));
  assert.ok(validateRecipient("0x123"));
  assert.ok(validateRecipient("0x" + "g".repeat(40)));
  assert.equal(validateRecipient(" " + ADDR + " "), null);
});

test("zero, negative and malformed amounts", () => {
  for (const v of ["0", "0.0", "-1", "-0.1", "", "abc", "1.0000000000000000001", "1e3"]) assert.ok(validateAmount(v).error, v);
  assert.equal(validateAmount("0.000000000000000001").wei, 1n);
  assert.equal(validateAmount("1.5").wei, 15n * 10n ** 17n);
});

test("insufficient balance and fee headroom", () => {
  assert.ok(validateFunds({ amountWei: 11n, balanceWei: 10n, feeWei: 0n }));
  const f = 1000n; // headroom 1500
  assert.equal(feeWithHeadroom(f), 1500n);
  assert.equal(feeWithHeadroom(1n), 2n); // rounds up
  assert.ok(validateFunds({ amountWei: 10_000n - 1500n, balanceWei: 10_000n, feeWei: f }) === null);
  assert.ok(validateFunds({ amountWei: 10_000n - 1500n + 1n, balanceWei: 10_000n, feeWei: f })); // balance covers fee but not headroom
  assert.equal(validateFunds({ amountWei: 10_000n, balanceWei: 10_000n, feeWei: 0n }), null);
  assert.ok(validateFunds({ amountWei: 0n, balanceWei: 10n, feeWei: 0n }));
});

test("wrong chain", () => {
  assert.equal(chainError(11155111), null);
  assert.ok(chainError(1));
  assert.ok(chainError(null));
});

test("error classification", () => {
  assert.equal(classifyError({ code: 4001, message: "x" }).kind, "rejected");
  assert.equal(classifyError(new Error("User rejected the request")).kind, "rejected");
  assert.equal(classifyError({ code: 4902 }).kind, "wrong_chain");
  assert.equal(classifyError(new Error("RPC unavailable")).kind, "rpc");
  assert.equal(classifyError(new SendError("wrong_chain", "m")).kind, "wrong_chain");
  assert.equal(classifyError(new Error("boom")).kind, "unknown");
});

test("hash and explorer link", () => {
  assert.ok(isTxHash(HASH)); assert.ok(!isTxHash("0x12")); assert.ok(!isTxHash(undefined));
  assert.equal(explorerTxUrl(HASH, "https://example.org/"), `https://example.org/tx/${HASH}`);
});

test("form validation errors keep the editing state", () => {
  const s = run([{ type: "edit", field: "recipient", value: "x" }, { type: "continue", recipientError: "bad", amountError: "bad" }]);
  assert.equal(s.phase, "editing");
});

test("happy path to confirmed", () => {
  let s = toReview();
  assert.equal(s.phase, "review");
  s = run([{ type: "approve" }], s); assert.equal(s.phase, "approving");
  s = run([{ type: "submitted", hash: HASH }], s); assert.equal(s.phase, "submitted");
  s = run([{ type: "poll_pending" }], s); assert.equal(s.phase, "pending");
  s = run([{ type: "poll_receipt", receipt: { status: "success", blockNumber: 7n } }], s);
  assert.deepEqual([s.phase, (s as { blockNumber: bigint }).blockNumber], ["confirmed", 7n]);
});

test("duplicate submit is ignored while approving and after broadcast", () => {
  let s = run([{ type: "approve" }], toReview());
  assert.ok(isSubmissionLocked(s));
  const again = reduce(s, { type: "approve" });
  assert.equal(again, s);
  s = run([{ type: "submitted", hash: HASH }], s);
  assert.equal(reduce(s, { type: "approve" }), s);
  assert.equal(reduce(s, { type: "reset" }), s); // cannot discard an in-flight tx
  assert.equal(reduce(s, { type: "edit", field: "amount", value: "9" }), s);
});

test("approve is blocked when review has a funds error", () => {
  const s = run([
    { type: "edit", field: "recipient", value: draft.to }, { type: "edit", field: "amount", value: "5" },
    { type: "continue", recipientError: null, amountError: null },
    { type: "prepared", draft, balanceWei: 1n, fee, fundsError: "Insufficient" },
  ]);
  assert.equal(reduce(s, { type: "approve" }), s);
});

test("rejection and wrong chain return to review", () => {
  for (const kind of ["rejected", "wrong_chain", "rpc"] as const) {
    let s = run([{ type: "approve" }, { type: "send_failed", kind, message: "m" }], toReview());
    assert.equal(s.phase, "failed");
    assert.equal((s as { kind: string }).kind, kind);
    s = reduce(s, { type: "back" });
    assert.equal(s.phase, "review");
    assert.equal(run([{ type: "approve" }], s).phase, "approving"); // can retry
  }
});

test("reverted and dropped are explicit", () => {
  const sub = run([{ type: "approve" }, { type: "submitted", hash: HASH }], toReview());
  assert.equal(reduce(sub, { type: "poll_receipt", receipt: { status: "reverted", blockNumber: 3n } }).phase, "reverted");
  assert.equal(reduce(sub, { type: "poll_dropped" }).phase, "dropped");
  assert.equal(reduce(reduce(sub, { type: "poll_dropped" }), { type: "reset" }).phase, "editing");
});

test("poll errors never settle the outcome", () => {
  const sub = run([{ type: "approve" }, { type: "submitted", hash: HASH }, { type: "poll_error", message: "down" }], toReview());
  assert.equal(sub.phase, "submitted");
  assert.equal((sub as { pollNote: string }).pollNote, "down");
});

test("late actions after settle are ignored", () => {
  const s = run([{ type: "approve" }, { type: "submitted", hash: HASH }, { type: "poll_receipt", receipt: { status: "success", blockNumber: 1n } }], toReview());
  assert.equal(reduce(s, { type: "poll_dropped" }), s);
});

test("decidePoll: dropped only after sustained misses", () => {
  assert.equal(decidePoll({ receipt: null, txKnown: true, misses: 5 }).misses, 0);
  let misses = 0, last: SendAction = { type: "reset" };
  for (let i = 0; i < DROP_AFTER_MISSES; i++) { const d = decidePoll({ receipt: null, txKnown: false, misses }); misses = d.misses; last = d.action; }
  assert.equal(last.type, "poll_dropped");
  assert.equal(decidePoll({ receipt: { status: "reverted", blockNumber: 1n }, txKnown: true, misses: 0 }).action.type, "poll_receipt");
});
