# Internal hiring allocation reconciliation

Reviewed October 17, 2026 against PR #7 head `9fa966e`, its discussion,
the dependent agent-bridge configuration and recovered project decisions.

## Supported baseline

| Quantity | Simulation representation | Meaning |
| --- | --- | --- |
| Domains/leaders | 5 domain leader slots | GTM Creative, GTM Operations, New Engineering, Existing Engineering, Design |
| Hiring authority | 250,000 internal BLUE per domain; 1,250,000 total | Nominal internal allocation, not cryptocurrency custody or wallet balance |
| Hiring seats | Global cap of 20 | No equal four-seat/domain split or cost per seat is implied |
| Voting power | One equal right per leader | Independent of hiring authority, spending, rewards and reputation |
| Reward weights | `null` | No approved domain/shared weighting or BLUE-to-reward conversion |
| Decision clock | Event-driven | Memory consolidation alone does not trigger a vote |
| Memory clock | 15 minutes | Separate consolidation specification; no scheduled job is enabled here |

The five `leader_id` values identify **domain slots**, not people. Null agent and
owner bindings do not confer membership, authority or credentials. Allocations
are keyed by these slots so a future verified identity binding need not rename
the budget. This is an example policy configuration, not a current balance ledger.

## Evidence and precedence

- The current task explicitly supplies the earlier 250,000-per-domain direction
  and authorizes representing sufficiently established rules in simulation.
- Recovered user decisions from October 16 at 02:18Z, 03:41Z and approximately
  04:08Z reaffirm five domains with 250,000 each and equal voting rights. These
  are conversation-retrieval evidence, not a fresh read of the referenced Airtable
  register. No external register or balances were changed or verified here.
- An intervening 03:35Z kickoff mentioned 100,000 nominal credits per person;
  later confirmations returned to 250,000. Do not silently mix kickoff credits
  with the hiring-authority allocation.
- [PR #7](https://github.com/aniphntm/my-blue-collar/pull/7), created October 16,
  left an approximately 200,000 figure unresolved. Its inspected discussion
  contains deployment-bot output, not a newer human budget decision. The dependent
  `social-02-core` and Concordia routing configs still carry null allocations.
  No retrieved newer user decision supersedes 250,000 per domain. Therefore the
  ambiguous 200,000 figure is not the selected simulation baseline: 200,000 total
  would mean 40,000/domain; 200,000/leader would mean 1,000,000 total.
- The separate [Blue Vote game-layer draft](https://github.com/aniphntm/my-blue-collar/blob/070e4ce6421693a555a63dac2352ab1578f10655/docs/specs/blue-vote-human-agent-game-layer.md)
  proposes 15-minute civic rounds, internal `$BLIW` terminology and an exactly-20
  completion condition. It supplies no replacement budget or numeric quorum.
  These proposed round rules do not turn the memory-consolidation timer into a
  voting rule. This hiring configuration retains the established 20-seat **cap**;
  completion criteria and currency-label migration require reconciliation.

## Unresolved, deliberately unconfigured

- Final five person/agent-to-domain bindings and verified user ownership. Older
  rosters name both Mira and Natali; PR #7 replaces Natali with Mira for the
  coworker persona. Do not collapse five domain seats into four or invent a
  fifth person. The two mail personas do not establish the whole leadership roster.
- Quorum, passage threshold, ties, vetoes, delegation and approved round timing.
  Equal voting rights alone cannot resolve an election.
- Reward weights, outcome scoring, policy training and any conversion between
  score, compensation, voting power and BLUE. The 40/40/20 retrieval mix supplies
  none of these values.
- Per-domain headcount distribution, candidate compensation, rollover/replenishment,
  burn/buyback sinks and staking. The prior 10% staking calculation was a proposal;
  it is not deducted from the 250,000 baseline.
- Authoritative opening commitments and occupied seats. Retrieved discussions
  mention Sidi/Sydney and Tani; this change does not fabricate a current hiring
  ledger or overwrite their status. Test snapshots are synthetic, not an assertion
  that all 20 seats or all authority remain available.
- Hosted-model and SocialJax hiring adapters remain unimplemented. Null bindings
  and reward weights still block a complete agent cycle.

## Executable validation scenarios

Run from the repository root:

```sh
node --test tests/hiring-mechanics.test.mjs
```

The pure offline validator checks domain uniqueness, exact per-slot and aggregate
allocations, independent equal voting rights, simulation-only flags and clock
separation. Synthetic batches check the 20-seat boundary, per-domain commitments,
combined overspending, duplicate IDs, stale state versions and malformed inputs.
Passing a batch means only that it fits the supplied resource snapshot: it neither
approves hires nor computes an election result or reward. No state is persisted.

This is not a concurrent server transaction, replay ledger or authentication
implementation. A future runtime must perform atomic snapshot/version checks,
idempotency and authorization against authoritative state before applying actions.
No SocialJax run, token issuance, transfers, financial operation, recurring job or
agent interface is added by this reconciliation.
