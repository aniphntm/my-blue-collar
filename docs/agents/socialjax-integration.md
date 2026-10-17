# SocialJax + agent bridge: first integration

Low-fidelity implementation contract, October 16, 2026. This document and the
[org-chart template](../../config/agents/org-chart.example.json) are specifications;
the bridge endpoints, hiring environment and hosted-model adapter are not implemented.

## Install the simulator

Use Python 3.10, as documented by upstream:

```sh
git clone https://github.com/cooperativex/SocialJax.git
cd SocialJax
python3.10 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
export PYTHONPATH="$PWD${PYTHONPATH:+:$PYTHONPATH}"
python -c 'from socialjax import make; make("clean_up", num_agents=5); print("Simulator loaded")'
```

These upstream commands have been checked against the README but not executed
here. Pin a reviewed commit before using simulation results for comparisons.

## Connect three backend pieces

1. **Simulation worker — Python/JAX.** Run SocialJax in a separate process or
   compute job. Start with a stock environment to verify the installation. Build
   a hiring-specific environment for the actual BLUE budget and headcount rules;
   the stock grid games do not implement hiring. Return observations, legal
   actions, outcomes and numeric rewards through an adapter.
2. **Agent runner — existing Next.js backend plus a hosted-model adapter.** Load
   each leader's identity, domain and budget from the org chart. Give the model
   its observation, objective and permitted memory; request a structured action.
   Validate the action before applying it. Model prose cannot directly change
   BLUE balances or seats. Keep balances and the 20-seat cap in authoritative
   server state.
3. **Bridge mailbox/memory — Next.js endpoints + Supabase Postgres + scheduled
   worker.** An explicit `remember` call writes a letter. A recall request reads
   only that agent/domain's permitted records. A 15-minute Cron invocation starts
   a durable job to consolidate unprocessed letters per scope. Commit the new
   digest, source references and processing checkpoint atomically; retry without
   duplicating writes. Preserve original letters and memory versions. Use a
   database outbox or durable queue when dispatching work.

Proposed bridge contract:

| Endpoint | Behavior |
| --- | --- |
| `POST /api/bridge/letters` | Explicit save with message ID/idempotency key and text; derive scope from authenticated identity |
| `POST /api/bridge/recall` | Natural-language search over authorized letters/digests; return source references; no memory write |
| `POST /api/bridge/actions` | Accept and validate a structured simulation action; record the outcome separately from voluntary memory |
| `GET /api/cron/consolidate` | Scheduler-authenticated invocation; dispatch separate jobs for scopes with pending letters |

A textbox can call `recall`, with a separate **Remember this** action. An agent
gets equivalent `recall` and `remember` tools. Merely thinking, querying or receiving
an observation does not create a letter. Simulation audit records are separate
from the agent's chosen memories.

Email can later be another ingress using AgentMail. It is not necessary for the
textbox or tool endpoint. Do not treat a sender-supplied agent ID as authorization.

## Point the runner at the org chart

Copy `config/agents/org-chart.example.json` to a private configured location and
bind the five domain leader slots to actual identities. Each entry needs a unique
`agent_id`, verified `owner_user_id`, `domain_id`, `objective`, `model_ref` and
`mailbox_scope`. Keep allocations in `budget.allocations_by_leader`, keyed by stable
`leader_id`; do not duplicate balances in leader entries. Select hosted model
credentials through server configuration, never through the org chart.

Set `ORG_CHART_PATH` for the proposed runner. The adapter's intended entry point is:

```sh
ORG_CHART_PATH=config/agents/org-chart.json python bridge/run_cycle.py --mode simulate
```

`bridge/run_cycle.py` and `ORG_CHART_PATH` are proposed integration contracts,
not existing upstream SocialJax features. The runner must reject an incomplete
roster, missing reward weights, inconsistent budgets or actions above the seat cap.
The template now specifies 250,000 internal BLUE hiring authority for each domain
leader slot (1,250,000 total), separate from equal voting rights, the global
20-seat cap and unset reward weights. See the [decision reconciliation](hiring-allocation-reconciliation.md).
Run `node --test tests/hiring-mechanics.test.mjs` for offline validation scenarios.
This validates constraints only; it does not implement the SocialJax hiring
environment, run an election or supply missing identity/reward mappings.

Keep Mira's `voting_defi` scope and Stacy's release-operations scope separate.
Mira replaces the former Natali persona. The user-authorized `natali_stacy`
handoff combines the supplied briefs, not every private memory or email.
Enforce scope on every database read/write and job; separate prompt text or
vector namespaces alone do not enforce authorization. Upstream sharing requires
an explicit publication into an authorized shared scope.

## Where the social behavior comes from

The loop is **observe → choose action → apply rules → score consequences → next
observation**. Shared scarce resources and reward rules create the social dilemma.
SocialJax's native RL algorithms update their policy weights over repeated rounds.
Its documented SVO and TRANSFER variants reshape rewards toward different
own-versus-others outcomes.

A hosted language model instead needs an adapter to turn observations into
context and structured responses into actions. Feed verified outcomes back into
its next context; retrieve voluntary memories when requested. This changes
inference context, not hosted model weights. Automated weight learning requires
a separately supported training pipeline. BLUE balances are state; a reward must
be defined and actually consumed by the decision/training loop.

## Decision clock and information flow

SocialJax advances one simulation step when the runner applies the agents' joint
actions to the environment. It does not impose a wall-clock cadence on an LLM.
For MyBlue, use event-driven decision turns: new user work, an addressed internal
message or a scheduled work item triggers a turn. Record the input event IDs and
state version; validate resulting actions against current state so concurrent
turns cannot consume the same budget or seat twice. The 15-minute memory job is
independent: it consolidates explicitly saved letters and does not force an agent
to act or write memories.

The initial retrieved-information budget follows the user's proposed mix:

| Source | Initial share | Retrieval boundary |
| --- | --- | --- |
| User and their work threads | 40% | Work explicitly accessible to that agent |
| Internal MyBlue agent network | 40% | Addressed messages and explicitly published shared records |
| Public social information | At most 20% | Relevant public inputs, preserving source and timestamp |

These percentages allocate the retrieved-context token budget after fixed
instructions and tool definitions. They are not reward weights, BLUE allocations,
trust scores or posting permissions. Public participation is not activated by
reading public inputs. The public share and cap are configurable; if adjusted,
require all source shares to sum to one and the public share to remain within
the chosen cap. Missing information does not justify invented content; leave
the allocation unused or record an explicit reallocation.

An incoming event is new when its source ID/version has not already been handled.
Existing scoped memories can be recalled through an explicit tool call; this
is contextual reuse, not net-new external information. Consolidation creates a
derived digest with original source IDs, rather than manufacturing a fresh fact.
Information spreads between agents only through addressed messages or explicit
publication to an authorized shared scope. Private-memory compaction is local
to its owner and domain; it never publishes automatically.

## First acceptance check

Run two simulated leaders through a single round before enabling the five-leader
cycle: each proposes an action, invalid/over-budget actions are rejected, one
explicitly saves a letter, and only its own scope can recall it. Repeat the
consolidation job and verify one digest with retained source references. A query
without `remember` must leave the letter count unchanged. No hiring decision,
currency transfer or on-chain transaction is executed by this first experiment.

Sources: [SocialJax](https://github.com/cooperativex/SocialJax),
[SVO](https://github.com/cooperativex/SocialJax/blob/main/algorithms/SVO/README.md),
[TRANSFER](https://github.com/cooperativex/SocialJax/blob/main/algorithms/TRANSFER/README.md).
