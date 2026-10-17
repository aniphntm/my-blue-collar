// Offline constraints only. No I/O, election resolution, state writes or provider calls.
import assert from 'node:assert/strict';

const domains = ['gtm_creative', 'gtm_operations', 'new_engineering', 'existing_engineering', 'design'];
const integer = (value) => Number.isSafeInteger(value) && value >= 0;

export function validateMechanics(config) {
  assert.equal(config.simulation.mode, 'simulation_only');
  assert.equal(config.simulation.financial_operations_enabled, false);
  assert.equal(config.simulation.issuance_enabled, false);
  assert.equal(config.leader_count, 5);
  assert.equal(config.headcount_cap, 20);
  assert.equal(config.leaders.length, 5);
  assert.deepEqual(config.leaders.map((l) => l.domain_id).sort(), [...domains].sort());
  const ids = config.leaders.map((l) => l.leader_id);
  assert.ok(ids.every((id) => typeof id === 'string' && id.length > 0));
  assert.equal(new Set(ids).size, 5);
  assert.equal(config.budget.unit, 'BLUE');
  assert.equal(config.budget.accounting, 'internal_hiring_authority');
  assert.equal(config.budget.allocation_per_domain, 250_000);
  assert.equal(config.budget.total_allocation, 1_250_000);
  assert.deepEqual(Object.keys(config.budget.allocations_by_leader).sort(), [...ids].sort());
  for (const id of ids) assert.equal(config.budget.allocations_by_leader[id], 250_000);
  assert.equal(config.voting.basis, 'one_equal_right_per_leader');
  assert.equal(config.voting.rights_per_leader, 1);
  assert.equal(config.voting.budget_weighted, false);
  // Policy and reward parameters remain deliberately unapproved in this baseline.
  for (const key of ['quorum', 'passage_threshold', 'tie_break', 'veto_policy']) {
    assert.equal(config.voting[key], null);
  }
  assert.equal(config.simulation.reward_weights, null);
  assert.equal(config.decision_clock.mode, 'event_driven');
  assert.equal(config.decision_clock.memory_consolidation_triggers_decision, false);
  assert.equal(config.memory.consolidation_interval_minutes, 15);
  const mix = config.information_mix;
  assert.ok([mix.user_work, mix.internal_agent_network, mix.public_social, mix.public_social_cap]
    .every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1));
  assert.ok(Math.abs(mix.user_work + mix.internal_agent_network + mix.public_social - 1) < 1e-9);
  assert.ok(mix.public_social <= mix.public_social_cap);
}

// Check a hypothetical batch against an explicit synthetic snapshot. Passing means
// within resource limits, never approved to hire/pay or ready for model execution.
export function validateProposalBatch(config, snapshot, batch) {
  validateMechanics(config);
  const allocations = config.budget.allocations_by_leader;
  assert.ok(integer(snapshot.version));
  assert.ok(integer(snapshot.seats_used) && snapshot.seats_used <= config.headcount_cap);
  assert.deepEqual(Object.keys(snapshot.committed_by_leader).sort(), Object.keys(allocations).sort());
  const committed = { ...snapshot.committed_by_leader };
  for (const [id, value] of Object.entries(committed)) {
    assert.ok(integer(value) && value <= allocations[id], 'invalid committed authority');
  }
  const seen = new Set();
  let seats = snapshot.seats_used;
  for (const proposal of batch) {
    assert.equal(proposal.state_version, snapshot.version, 'stale snapshot');
    assert.ok(typeof proposal.id === 'string' && proposal.id.length > 0 && !seen.has(proposal.id), 'duplicate/invalid proposal ID');
    seen.add(proposal.id);
    assert.ok(Object.hasOwn(allocations, proposal.leader_id), 'unknown leader slot');
    assert.ok(integer(proposal.blue_commitment), 'invalid BLUE commitment');
    assert.ok(integer(proposal.seats) && proposal.seats > 0, 'invalid seat request');
    committed[proposal.leader_id] += proposal.blue_commitment;
    assert.ok(Number.isSafeInteger(committed[proposal.leader_id]) && committed[proposal.leader_id] <= allocations[proposal.leader_id], 'domain budget exceeded');
    seats += proposal.seats;
    assert.ok(Number.isSafeInteger(seats) && seats <= config.headcount_cap, 'global seat cap exceeded');
  }
  return { within_resource_limits: true, election_resolved: false, reward: null };
}
