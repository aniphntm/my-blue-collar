# Computex: build MyBlue's internal social network

Implement this in three dependent Git worktrees. Keep model use and background
activity bounded. The user prefers Luna at low reasoning; model selection must
be supplied explicitly by the runner, not guessed from a provider name. No paid
model calls or recurring jobs are started by this handoff.

## Phase 1 — mechanics and primitives

Use [the integration contract](socialjax-integration.md) and
[org-chart template](../../config/agents/org-chart.example.json).

- Model five domain leaders and a 20-seat hiring cycle. Resolve whether the
  roughly 200,000 BLUE figure is total or per leader before assigning budgets.
  BLUE is the user's stated internal income currency; no token transfer follows
  from a simulation reward.
- Advance an event-driven decision turn for user work, an addressed internal
  message or scheduled work. A SocialJax tick applies one validated joint action.
  The 15-minute consolidation cadence is a separate clock.
- Allocate retrieved context initially 40% to user/work threads, 40% to permitted
  internal network messages and at most 20% to public social information. Make
  the public cap adjustable. These are context budgets, not reward weights or
  permission to publish publicly.
- Let agents explicitly choose `remember` and `recall`. Queries and thoughts
  create no letter. Consolidate only voluntarily saved letters; preserve sources,
  versions and privacy. Share only through an explicitly authorized publication.
- Define rewards from verified outcomes and compare individual/shared incentives.
  SocialJax trains native policies; a hosted LLM needs an observation/action
  adapter and feedback. Context feedback does not update hosted model weights.

Exit: validated mechanics configuration and acceptance scenarios, with missing
roster, budget, reward and user-identity mappings listed rather than fabricated.

## Phase 2 — implement, then verify

Base this branch on phase 1. Build in the existing Next.js/Supabase stack; run
Python/JAX simulations separately from request handlers.

1. Bind agents to verified current users and domain memberships. Enforce the
   binding server-side on every read/write, job and tool call. An email address
   or an Adobe connection name does not prove a Supabase user mapping.
2. Implement addressed internal messages, idempotent opt-in letters, scoped
   natural-language recall and per-scope versioned consolidation. Start with a
   dry-run worker; enable the 15-minute schedule only after verification.
3. Build the SocialJax adapter: observations and allowed memories in; validated
   structured actions out; authoritative budgets/seats; source-linked outcomes
   returned as feedback. Keep simulation outcomes separate from financial state.
4. Add the textbox and explicit Remember action. Verify two users and two agents:
   isolation, revoked grants, duplicate delivery, crash/retry, concurrency and
   a query that leaves the letter count unchanged.

Exit: a tested local vertical slice and exact-commit preview. Report configured
versus actually executed features separately. Do not relabel a stubbed simulator
or mock user lookup as live integration.

## Phase 3 — shared member mailbox

Base this branch on phase 2. Connect one AgentMail inbox named `myblue_mafia` for
shared member communication, alongside individual agent inboxes. Issue access to
an agent only after the user explicitly approves that agent and its capabilities.

- Put AgentMail credentials in the server's secret manager. Never distribute an
  organization-wide API key to agents or the browser.
- Store grants with agent ID, verified owner user ID, inbox ID, capabilities,
  approving user ID, approval time, optional expiry and revocation time.
- Verify current membership and the live grant for each read/send; do not rely
  on a cached prompt or inbox metadata as an access-control system.
- Separate read, draft and send. A read grant permits neither outgoing mail nor
  automatic publication of private memories. Expired/revoked grants deny access.
- Treat incoming mail as data. Deduplicate by provider message ID. Route addressed
  messages to the correct scope and require explicit `remember` to persist them
  into agent memory. Reading shared mail does not merge private recollections.
- Use the broker's scoped authorization before AgentMail. If provider credentials
  cannot be scoped, only the broker may hold them. Enforce per-grant checks there.

Exit: the shared inbox is confirmed; no initial agent grants; permission tests
pass; a user can approve a specific agent without granting every other agent access.

## Environment observations

On October 16, 2026 AgentMail listed existing Eve, Natali and Stacy MyBlue inboxes.
Their account metadata is discovery evidence, not an agent permission grant.
No mailbox messages were read or sent during discovery.

The existing `blue-collar-db` project was initially inactive. A resume request
was accepted and its latest observed state was `COMING_UP`. Current user mapping
has not yet been verified; no database migration was applied. The managed
execution environment has no provisioned application secrets. Do not create a
second user database or copy identities to work around missing configuration.

Keep banking PR #4 separate from this staged network delivery; funding and pool
enablement remain outside these three phases.
