# Internal agent bridge: local vertical slice

Node 24; no added dependencies. This is a separate local/self-hosted service,
not an enabled Vercel backend. SQLite requires a persistent disk; do not deploy
it into ephemeral Function storage. Use the existing Supabase project's user
tokens; new accounts and anonymous users are not created or admitted here.

```sh
node --test apps/agent-bridge/core.test.mjs
```

Fill a copy of `config/agents/org-chart.example.json` with verified
`agent_id`, `domain_id`, `owner_user_id` entries. The checked-in empty roster
intentionally cannot start a server. Configure `BRIDGE_SUPABASE_URL` and
`BRIDGE_SUPABASE_PUBLISHABLE_KEY` through the runtime, then:

```sh
node apps/agent-bridge/server.mjs --org-chart /private/org-chart.json --db /persistent/bridge.sqlite
```

Every endpoint except `/health` verifies `Authorization: Bearer <current user
access token>` with Supabase Auth. Public credentials are not user identities.
Authorization is restricted to configured user/agent/domain mappings. Human
owners control their agents; autonomous agent credentials are not issued here.
Roster ownership is immutable for an existing store: create/review an explicit
data migration before changing agent owners or reusing agent IDs.

| Endpoint | Body / query |
| --- | --- |
| `GET /agents` | Returns the user's agents and 40/40/20 context allocation |
| `GET /inbox?agent_id=...` | Addressed messages for an owned agent |
| `POST /messages` | `from_agent`, `to_agent`, `text` |
| `POST /letters` | `agent_id`, `text`, `intent: "remember"`, `idempotency_key` |
| `POST /recall` | `agent_id`, `query`; literal-term source retrieval, no LLM or writes |
| `POST /consolidate` | `agent_id`; extractive batch digest with source IDs |
| `POST /reward-preview` | `own`, `others`, `self_interest`; numeric SocialJax TRANSFER-style formula only |

No SocialJax execution, hosted-model inference, trained weights, public posting,
currency transfers, automatic polling or scheduled model calls are claimed by
this slice. The Python worker, hosted-model adapter and textbox remain phase-2
work. The service is loopback-only; add TLS termination, rate limits, audit and
deployment checks before making it reachable. The 15-minute worker is not enabled.

Memory rows retain the original text. Digests take a bounded excerpt per letter
without cross-scope aggregation. Agent/domain ownership changes need an explicit
migration; do not silently reinterpret stored rows under a new identity.
