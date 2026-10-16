import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BridgeStore, contextBudget, mixedReward, validateOrg } from './core.mjs';

const one = '11111111-1111-4111-8111-111111111111';
const two = '22222222-2222-4222-8222-222222222222';
const config = JSON.parse(readFileSync(new URL('../../config/agents/org-chart.example.json', import.meta.url)));
config.leaders = [
  { agent_id: 'mira', domain_id: 'voting_defi', owner_user_id: one },
  { agent_id: 'stacy', domain_id: 'operations', owner_user_id: two },
];
const alice = { userId: one }, bob = { userId: two };
const save = (agent_id, text, idempotency_key = 'a_stable_request_key') => ({ agent_id, text, idempotency_key, intent: 'remember' });

test('mapping, context mix and SocialJax transfer-style reward are explicit', () => {
  assert.throws(() => validateOrg({ ...config, leaders: [] }), /mappings/);
  assert.throws(() => validateOrg({ ...config, information_mix: { ...config.information_mix, public_social: 0.3 } }), /mix/);
  assert.deepEqual(contextBudget(config, 100), { user_work: 40, internal_agent_network: 40, public_social: 20, unused: 0 });
  assert.equal(mixedReward(10, [0, 0, 0, 0], 0.2), 2);
  assert.equal(mixedReward(10, [0], 1), 10);
  assert.throws(() => mixedReward(10, [], 0.5));
});

test('messages are addressed; memory is opt-in and isolated across users and agent principals', () => {
  const store = new BridgeStore(':memory:', config);
  try {
    store.send(alice, { from_agent: 'mira', to_agent: 'stacy', text: 'Interview proposal' });
    assert.equal(store.inbox(bob, 'stacy').length, 1);
    assert.equal(store.inbox(alice, 'mira').length, 0);
    assert.throws(() => store.inbox(alice, 'stacy'), /scope/);
    assert.equal(store.recall(bob, { agent_id: 'stacy', query: 'Interview' }).length, 0);
    assert.throws(() => store.remember(alice, { ...save('mira', 'Budget context'), intent: 'query' }), /Explicit/);
    store.remember(alice, save('mira', 'Budget context'));
    assert.throws(() => store.recall(bob, { agent_id: 'mira', query: 'Budget' }), /scope/);
    assert.throws(() => store.recall({ userId: one, agentId: 'stacy' }, { agent_id: 'mira', query: 'Budget' }), /scope/);
    assert.equal(store.recall(alice, { agent_id: 'mira', query: 'Budget' }).length, 1);
    assert.equal(store.db.prepare('SELECT count(*) AS n FROM letters').get().n, 1);
  } finally { store.close(); }
});

test('remember retries are idempotent; consolidation retains sources and cannot mix scopes', () => {
  const store = new BridgeStore(':memory:', config);
  try {
    const first = store.remember(alice, save('mira', 'Keep the original source'));
    assert.equal(store.remember(alice, save('mira', 'Keep the original source')).id, first.id);
    assert.throws(() => store.remember(alice, save('mira', 'Different body')), /different/);
    store.remember(bob, save('stacy', 'Private operations context'));
    const digest = store.consolidate(alice, 'mira');
    assert.deepEqual(digest.source_ids, [first.id]);
    assert.doesNotMatch(digest.content, /operations/);
    assert.equal(store.consolidate(alice, 'mira').processed, 0);
    assert.equal(store.recall(alice, { agent_id: 'mira', query: 'original' })[0].id, first.id);
    assert.equal(store.consolidate(bob, 'stacy').processed, 1);
  } finally { store.close(); }
});

test('letters survive a process restart when using a persistent disk file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'myblue-bridge-'));
  const path = join(dir, 'bridge.sqlite');
  try {
    const first = new BridgeStore(path, config);
    first.remember(alice, save('mira', 'Restart recovery'));
    first.close();
    const next = new BridgeStore(path, config);
    assert.equal(next.recall(alice, { agent_id: 'mira', query: 'recovery' }).length, 1);
    next.close();
    const reassigned = structuredClone(config);
    reassigned.leaders[0].owner_user_id = two;
    assert.throws(() => new BridgeStore(path, reassigned), /ownership changed/);
  } finally { rmSync(dir, { recursive: true }); }
});
