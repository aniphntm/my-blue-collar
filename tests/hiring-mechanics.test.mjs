import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateMechanics, validateProposalBatch } from '../scripts/validate-hiring-mechanics.mjs';

const baseline = JSON.parse(readFileSync(new URL('../config/agents/org-chart.example.json', import.meta.url)));
const copy = () => structuredClone(baseline);
const ids = baseline.leaders.map((l) => l.leader_id);
const snapshot = () => ({ version: 1, seats_used: 0, committed_by_leader: Object.fromEntries(ids.map((id) => [id, 0])) });
const proposal = (changes = {}) => ({ id: 'synthetic-1', state_version: 1, leader_id: ids[0], blue_commitment: 250_000, seats: 1, ...changes });

test('baseline has five distinct domain slots, 1.25M authority, equal votes and no reward policy', () => {
  validateMechanics(baseline);
  assert.ok(baseline.leaders.every((l) => l.agent_id === null && l.owner_user_id === null));
});

test('neither 200K interpretation silently replaces the confirmed allocation', () => {
  for (const amount of [40_000, 200_000]) {
    const config = copy();
    config.budget.allocation_per_domain = amount;
    config.budget.total_allocation = amount * 5;
    for (const id of ids) config.budget.allocations_by_leader[id] = amount;
    assert.throws(() => validateMechanics(config));
  }
});

test('exactly 20 synthetic seats can fit; no per-domain seat split is assumed', () => {
  const state = snapshot();
  const before = structuredClone(state);
  assert.deepEqual(validateProposalBatch(baseline, state, [proposal({ seats: 20 })]), {
    within_resource_limits: true, election_resolved: false, reward: null,
  });
  assert.deepEqual(state, before);
  assert.throws(() => validateProposalBatch(baseline, state, [proposal({ seats: 21 })]));
});

test('joint proposals cannot double-consume the last seat or domain authority', () => {
  const state = snapshot();
  state.seats_used = 19;
  const batch = [proposal({ blue_commitment: 1 }), proposal({ id: 'synthetic-2', blue_commitment: 1, leader_id: ids[1] })];
  assert.throws(() => validateProposalBatch(baseline, state, batch), /seat cap/);
  state.seats_used = 0;
  assert.throws(() => validateProposalBatch(baseline, state, [proposal(), proposal({ id: 'synthetic-2', blue_commitment: 1 })]), /budget exceeded/);
});

test('commitments cannot borrow another domain budget or change voting rights', () => {
  const state = snapshot();
  state.committed_by_leader[ids[0]] = 249_999;
  assert.throws(() => validateProposalBatch(baseline, state, [proposal({ blue_commitment: 2 })]), /budget exceeded/);
  validateProposalBatch(baseline, state, [proposal({ blue_commitment: 1 })]);
  assert.equal(baseline.voting.rights_per_leader, 1);
});

test('reject unknown slots, stale versions, duplicate IDs and malformed resource amounts', () => {
  for (const changes of [{ leader_id: 'unbound-agent' }, { state_version: 0 }, { blue_commitment: -1 },
    { blue_commitment: 0.5 }, { blue_commitment: Infinity }, { seats: 0 }, { seats: 1.5 }]) {
    assert.throws(() => validateProposalBatch(baseline, snapshot(), [proposal(changes)]));
  }
  assert.throws(() => validateProposalBatch(baseline, snapshot(), [proposal({ blue_commitment: 1 }), proposal({ blue_commitment: 1 })]), /proposal ID/);
  const invalid = snapshot();
  invalid.committed_by_leader[ids[0]] = -1;
  assert.throws(() => validateProposalBatch(baseline, invalid, []));
});

test('reject currency weighting, invented reward policy, financial enablement and memory-triggered decisions', () => {
  for (const mutate of [
    (c) => { c.voting.budget_weighted = true; },
    (c) => { c.simulation.reward_weights = [0.4, 0.4, 0.2]; },
    (c) => { c.voting.quorum = 3; },
    (c) => { c.simulation.mode = 'live'; },
    (c) => { c.simulation.financial_operations_enabled = true; },
    (c) => { c.simulation.issuance_enabled = true; },
    (c) => { c.decision_clock.memory_consolidation_triggers_decision = true; },
    (c) => { c.leaders[1].domain_id = c.leaders[0].domain_id; },
    (c) => { c.budget.allocations_by_leader.extra = 250_000; },
  ]) {
    const config = copy(); mutate(config);
    assert.throws(() => validateMechanics(config));
  }
});
