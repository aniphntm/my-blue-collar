# Blue Vote human-agent game layer

Status: implementation spec  
Branch: `blue-vote/human-agent-game-layer`

## Decision

Blue Vote will use the interaction pattern from Melting Pot's
`meltingpot/human_players`: every participant—human or agent—acts through the
same discrete action contract, receives a scoped observation, and contributes to
one auditable episode ledger.

We will not embed DeepMind Lab2D or copy its visual engine. Existing MyBlue
channels, voice, memory, voting UI, and $BLIW ledger are the environment.

SocialJax remains an offline simulation and policy-testing dependency. The
production coordination loop stays lightweight and deterministic.

## Core mapping

| Melting Pot concept | Blue Vote equivalent |
|---|---|
| substrate | vote, hiring round, allocation round, or work sprint |
| player prefix | stable employee/agent identity |
| observation | current proposal, channel context, relevant memory, budget, commitments |
| action map | constrained civic action schema |
| timestep | accepted event in the round ledger |
| reward | shipped work, peer trust, budget efficiency, fulfilled commitments |
| episode | one bounded decision round |
| player switch | human takeover or delegated-agent control |
| event stream | append-only civic ledger |

## Action contract

All voice, chat, UI, or agent output is normalized into one of these actions:

`propose · endorse · challenge · amend · allocate · hire · veto · abstain · commit · deliver`

Every accepted action has this envelope:

```ts
type CivicAction = {
  id: string;
  roundId: string;
  actorId: string;
  actorType: "human" | "agent";
  actingFor?: string;
  kind:
    | "propose"
    | "endorse"
    | "challenge"
    | "amend"
    | "allocate"
    | "hire"
    | "veto"
    | "abstain"
    | "commit"
    | "deliver";
  targetId?: string;
  payload: Record<string, unknown>;
  evidenceRefs: string[];
  memoryRefs: string[];
  tokenDelta?: number;
  createdAt: string;
  idempotencyKey: string;
};
```

Free-form speech is context, never the authoritative state transition. A parser
may suggest a structured action, but the game layer validates permissions,
budget, round phase, and invariants before appending it.

## Runtime boundary

```text
voice / chat / voting UI / agent
              |
         input adapters
              |
       CivicAction validator
              |
       deterministic reducer
          /           \
 round state        event ledger
      |                  |
 observations       memory promotion
      |
 humans + agents
```

### Input adapters

- Human adapter: converts button presses, forms, chat commands, and confirmed
  voice intent into `CivicAction`.
- Agent adapter: constrains model output to the same schema.
- Takeover adapter: lets a human temporarily act for an agent or reclaim a
  delegated seat; all such actions carry `actingFor`.
- Replay adapter: rebuilds state exclusively from ledger events.

### Observation builder

Each participant gets the minimum sufficient view:

- round question and phase;
- proposals and relevant arguments;
- their role, permissions, budget, and commitments;
- public team state;
- selectively retrieved durable memory;
- private context only when authorized.

Raw cross-channel history is not injected wholesale.

## Fifteen-minute round loop

1. **Open — 2 minutes:** publish question, participants, available $BLIW, rules.
2. **Propose — 4 minutes:** proposals and amendments.
3. **Deliberate — 4 minutes:** endorse, challenge, evidence, budget revisions.
4. **Resolve — 3 minutes:** vote, veto checks, allocation validation.
5. **Commit — 2 minutes:** owners accept deliverables and deadlines.
6. **Close:** freeze result, emit summary, promote durable memory, schedule
   follow-up from commitments.

The clock may pause for explicit human review, but agents cannot extend a round
or spend funds merely by continuing to speak.

## Rewards and accounting

Rewards are initially computed after the round, not used to autonomously move
money:

```text
score =
  shipped_work
  + peer_trust
  + budget_efficiency
  + fulfilled_commitments
  - coordination_cost
  - abandoned_commitments
```

$BLIW is employee income and internal allocation currency. Therefore:

- a score is not a payment;
- a proposed token transfer is not a ledger transfer;
- payments require an accepted allocation action plus policy approval;
- token balance, voting weight, and reputation are separate fields;
- all issuance and transfers are append-only and auditable.

## First substrate: headcount allocation

Question: how should 20 roles be allocated across five domains?

Players: the five champions and any authorized human participant.

State:

- domain;
- requested headcount;
- current allocation;
- champion budget;
- candidate/hire proposals;
- evidence and commitments.

Termination:

- allocations total exactly 20;
- no domain or champion exceeds policy limits;
- quorum is met;
- unresolved vetoes are either sustained or explicitly overridden by policy.

Initial domains:

1. creative go-to-market;
2. go-to-market operations;
3. new engineering;
4. old engineering;
5. design.

## Implementation slices

### Slice 1 — deterministic core

Create `lib/civic-game/` with:

- `types.ts`: actions, observations, round state;
- `validate.ts`: permission, phase, budget, and invariant checks;
- `reduce.ts`: pure event-to-state reducer;
- `observe.ts`: per-player observation projection;
- `replay.ts`: state reconstruction;
- focused unit tests.

No model calls and no token transfers in this slice.

### Slice 2 — channel adapters

Add adapters for the voting UI and chat thread. Each adapter must emit the same
action envelope and receive the same observation shape. Voice transcription is
accepted only after intent confirmation when it would allocate funds, hire,
veto, or finalize a vote.

### Slice 3 — agents and memory

Add an agent policy interface:

```ts
interface CivicPolicy {
  act(observation: CivicObservation): Promise<CivicAction | null>;
}
```

Promote only decisions, commitments, role changes, unresolved disputes, and
delivery evidence into durable memory. Ephemeral banter remains in the source
channel.

### Slice 4 — simulation harness

Translate historical or synthetic rounds into SocialJax-compatible games for
offline policy testing. Compare policies on cooperation, capture resistance,
budget efficiency, commitment completion, and robustness to unfamiliar agents.
Never train directly against production wallets or payroll.

## Acceptance criteria

- Humans and agents can participate in the same round without privileged action
  semantics.
- Every state change replays deterministically from the event ledger.
- Human takeover is visible and reversible.
- Invalid phase, permission, quorum, and budget actions are rejected.
- A round cannot overspend $BLIW or allocate more than the available headcount.
- Memory citations and evidence references survive replay.
- Agent text alone cannot hire, pay, veto, or finalize.
- The first 20-role allocation round completes end to end in 15 minutes.

## Source inspirations

- [Melting Pot human players](https://github.com/google-deepmind/meltingpot/tree/main/meltingpot/human_players)
- [Melting Pot level playing utilities](https://github.com/google-deepmind/meltingpot/blob/main/meltingpot/human_players/level_playing_utils.py)
- [SocialJax](https://github.com/cooperativex/SocialJax)

This specification adapts architectural patterns only; no third-party source
code is copied.
