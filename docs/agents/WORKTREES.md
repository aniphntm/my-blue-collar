# Three dependent MyBlue social-network worktrees

| Stage | Branch | Local path | Result |
| --- | --- | --- | --- |
| 1: mechanics | `codex/social-01-mechanics` | `/workspace/worktrees/myblue-social-01-mechanics` | Computex brief, organization template, Mira/Stacy consolidated handoff |
| 2: implementation | `codex/social-02-core` | `/workspace/worktrees/myblue-social-02-core` | Scoped local Node bridge, opt-in letters, recall, atomic extractive consolidation, reward preview |
| 3: shared mailbox | `codex/social-03-mafia` | `/workspace/worktrees/myblue-social-03-mafia` | Permission policy and denial/revocation tests; provider provisioning blocked |

Stage 2 contains stage 1; stage 3 contains stage 2. Merge/rebase and validate in
that order. The implementation uses Node built-ins and starts no paid model work.

Run from stage 3:

```sh
node --test apps/agent-bridge/*.test.mjs
```

The first delivery is local code and a staged handoff, not a live user-linked
network. The existing Supabase `blue-collar-db` was resumed and reports healthy,
but a read-only count found zero Auth users. The intended current-user identity
provider and owner mappings must be identified before the server can admit users.
No database migration or account creation was performed.

AgentMail confirmed the persona rename to Mira on the existing
`natali-myb@agentmail.to` inbox. Mira and Stacy inbox metadata now reference the
shared handoff `natali_stacy`. Their email contents were not merged or read.
See [the consolidated brief](natali_stacy.md).

Creating `myblue_mafia` was denied because the account is at its three-inbox
limit. No inbox was deleted, repurposed or upgraded. The user was asked whether
to keep context consolidation only or repurpose Stacy's inbox; no response has
yet been received. There are no mailbox grants or active polling jobs. The
permission helper is tested locally but is not wired to a deployed AgentMail
broker; do not claim it enforces the existing provider account.

Remaining phase-2 work: actual SocialJax Python worker and hosted-model adapter,
textbox, current-user integration and full HTTP/deployed verification. Current
recall is literal-term retrieval and compaction is extractive. The reward preview
implements the documented TRANSFER-style equation, not a running SocialJax model.
