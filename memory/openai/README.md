# OpenAI channel

This channel covers Codex tasks and other OpenAI conversations contributing to My Blue. Use `threads/<stable-id>.md` for each accessible thread's durable summary; group by project later if useful.

## Consolidation protocol

- Discover threads only through capabilities actually available to the session.
- Read each source thread before relying on its contents. If the reader is unavailable, retain the access gap and ask for relevant context when it blocks work.
- Identify threads by stable ID and source reference, not title alone.
- Record observed status, last verified date, shared objective, decisions, dependencies, and next action. Do not infer that a thread is running from its presence in a reference list.
- Reconcile overlapping work by linking related notes and identifying the latest verified decision. Preserve unresolved conflicts.
- Promote only durable changes to [the nucleus](../NUCLEUS.md).

## Initial state — 2026-10-17

The current voice request establishes the memory architecture: a persistent GitHub store under `memory/`, channel subtrees including OpenAI/Codex, and an evolving nucleus receiving thoughtful updates from ongoing work.

This statement is based on the user request visible in the current session. Other Codex thread contents and running-task states have not been read or verified. Cross-thread consolidation remains pending source access.

Future summaries should use:

```markdown
# <task>
Source: <stable reference>
Last verified: <UTC date>
Status: <observed status; unknown if unavailable>

## Objective
## Decisions and evidence
## Uncertainty and dependencies
## Next action
## Supersedes / related
```

Publishing a new snapshot requires an active session or an explicitly configured integration. No automatic thread ingestion or background publisher has been installed.
