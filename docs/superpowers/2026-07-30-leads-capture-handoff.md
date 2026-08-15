# Handoff: Supabase leads capture — blocked on RLS mystery

## Where this fits

Project: MyBlueCollar landing page, in `web/` (Next.js, its own git repo,
`origin` = `github.com/aniphntm/my-blue-collar.git`, currently on `main`
with a bunch of *pre-existing, unrelated* uncommitted changes — don't
`git add -A`, don't touch those). The `web/` repo is a standalone Next.js
project inside `/Users/ani/Desktop/projects/blue-collar`, which itself is
not a git repo.

Task: give the waitlist form (`components/waitlist-form.tsx`, rendered by
`components/join.tsx`) a real backend. It previously just flipped local
React state on submit with no persistence.

Approved design spec (read this for full rationale):
`web/docs/superpowers/specs/2026-07-30-supabase-leads-design.md`

## What's done (implemented, working code, NOT yet committed)

- `web/supabase/migrations/20260730200445_create_leads.sql` — creates
  `public.leads` (bigint identity PK, unique email, CHECK constraints on
  `trade`/`employees`/`jobs_per_month` matching the form's `<select>`
  options exactly, `phone`/`current_software` nullable), enables RLS, adds
  one policy: `to anon for insert with check (true)`, named
  `"Allow public lead submissions"`.
- User ran this migration successfully in the Supabase SQL editor.
- `web/.env.local` (gitignored) and `web/.env.local.example` — Supabase
  URL + publishable key.
- `web/lib/supabase.ts` — exports a `supabase` browser client built from
  the env vars.
- `web/components/waitlist-form.tsx` — `handleSubmit` is now async,
  inserts into `leads` via `supabase.from("leads").insert(...)`, maps
  `jobsPerMonth`→`jobs_per_month` etc., shows "You're already on the
  list!" on a `23505` unique-violation, generic inline error + retry
  otherwise, disables the submit button while in flight.
- `@supabase/supabase-js@2.111.0` added to `package.json`/
  `package-lock.json` (pinned, per security best practice).
- `npx tsc --noEmit` and `npm run lint` both clean.

Credentials in use (safe to reuse — client-tier keys, not secrets):
```
Project URL:      https://hqscogrqifqrpnsbojte.supabase.co
Publishable key:  sb_publishable_v8UsFrEEdC7_HPns6zoyUg_9gzzMMRV
Legacy anon JWT:   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxc2NvZ3JxaWZxcnBuc2JvanRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MzQ2NzIsImV4cCI6MjEwMTAxMDY3Mn0.vhCYD9UTEA3R3IH_g2Fv5-nXoG9aRqxqI5e1FUuHHBg
```

## What's blocking: INSERT is denied for `anon` despite everything checking out

Manual REST API test (no browser tool was available this session — Claude
in Chrome isn't connected — so this was verified via `curl` against
PostgREST directly, same path the JS client takes):

```
POST https://hqscogrqifqrpnsbojte.supabase.co/rest/v1/leads
→ 401 {"code":"42501","message":"new row violates row-level security policy for table \"leads\""}
```

This happens identically whether using the new publishable key (as
`apikey` + `Authorization: Bearer`, or `apikey` alone) **or** the legacy
JWT anon key (payload confirmed `"role":"anon"`). So it's not a
publishable-vs-legacy-key issue.

Diagnostics run so far, all of which look *correct*:

1. `select policyname, roles, cmd, qual, with_check from pg_policies where tablename = 'leads';`
   → `Allow public lead submissions | {anon} | INSERT | null | true`
2. `select grantee, privilege_type from information_schema.role_table_grants where table_name = 'leads';`
   → `anon` has INSERT/SELECT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER
   (Supabase's default public-schema grants — same for `authenticated`,
   `postgres`, `service_role`)
3. `select relrowsecurity from pg_class where relname = 'leads';` → `true`
4. `GET /rest/v1/leads?select=id&limit=1` with the publishable key → `200 []`
   (table **is** reachable/exposed via the Data API schema cache — rules
   out a "table not exposed" or schema-cache problem)
5. User ran `grant insert on public.leads to anon;` explicitly (redundant
   given #2, but ruled out as the cause — still fails after)

So: policy exists and is permissive with `with_check(true)`, grants are
present, RLS is on, the table is reachable — and yet INSERT as `anon` is
rejected. This is unexplained.

## Next diagnostic to run (was about to do this when interrupted)

Ask the user to run this directly in the SQL editor — it exactly mimics
what PostgREST does (`SET ROLE anon` then the insert) but surfaces the
**raw** Postgres error instead of PostgREST's generic wrapper, which
should disambiguate a PostgREST-layer issue from a genuine Postgres-layer
one:

```sql
set role anon;
insert into public.leads (name, business, email, trade, employees, location, jobs_per_month)
values ('Diag Test', 'Diag Co', 'diag-test@example.com', 'Electrical', 'Just me', 'Austin, TX', '1–10');
reset role;
```

(Note: `employees`/`jobs_per_month` values use an en dash `–`, U+2013 —
not a hyphen — matching the CHECK constraint values. Copy carefully.)

If this succeeds → the bug is specific to PostgREST/Data API's role
handling for this project (worth checking Supabase status page / support
for a platform-side issue with the new key rollout).
If this also fails with the RLS message → there's a real, currently
invisible-to-us RLS/policy issue (maybe a second restrictive policy, a
FORCE ROW LEVEL SECURITY interaction, or something not visible in the
`pg_policies` view we queried — worth also checking
`select * from pg_policies where tablename='leads';` unfiltered, and
`select relforcerowsecurity from pg_class where relname='leads';`).

Other avenues not yet tried:
- Test with the `service_role` secret key (bypasses RLS) to confirm the
  table/columns themselves are fine and isolate this as purely an RLS/role
  issue.
- Check Settings → API in the Supabase dashboard for anything unusual in
  Data API config (exposed schemas, max rows, etc.) beyond what's been
  checked.
- If a Supabase CLI or MCP server becomes available in a later session,
  `supabase db advisors` / `get_advisors` might surface something the
  manual introspection missed.

## Test data left behind

Several insert attempts were made against the live table with these
emails — all should have failed (blocked by RLS), so the table is likely
still empty, but worth double-checking / cleaning up once inserts start
working: `sdd-test-lead@example.com`, `sdd-test-lead-2@example.com`,
`sdd-test-lead-3@example.com`, `diag-test@example.com` (this last one
only if the SQL-editor diagnostic above was run and succeeded).

## Process state (subagent-driven-development detour)

User ran `/superpowers:subagent-driven-development` mid-session. There was
no written plan file, so per that skill's own gate it doesn't apply as-is.
User chose "retroactively write a plan + review" — i.e., write a plan doc
via `writing-plans` documenting the (already-implemented) work, then run
the *review* portion of subagent-driven-development against the existing
diff instead of dispatching implementer subagents (since the code already
exists). **This was not done yet** — got sidetracked into the RLS
debugging above before writing the plan doc. Once the RLS issue is
resolved and end-to-end verified, still need to:

1. Write `web/docs/superpowers/plans/2026-07-30-supabase-leads-capture.md`
   per the `writing-plans` skill format (header, Global Constraints, tasks
   matching migration / client+env / form-wiring, with the actual code
   already written filled in as the task content).
2. Run task-scoped reviews (spec compliance + quality) against the
   existing diff for each "task", then a final whole-branch review, per
   `subagent-driven-development`'s review process — adapted to review
   already-written code rather than dispatching fresh implementers.

## Other loose ends

- Nothing in `web/` has been committed yet. The repo already had unrelated
  uncommitted work in progress before this session (modified
  `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, deleted
  `public/*.svg`, untracked `components/`, `lib/`) — stage and commit only
  the files this task touched, not those.
- Dev server is already running on `localhost:3000` (PID 33242, was
  running before this session started — a second attempt on port 3001
  self-exited with "another next dev server is already running", so don't
  try to start a duplicate).
- No browser automation tool is connected this session (Claude in Chrome
  not set up) — once the backend works, either connect that or ask the
  user to click through the form manually for final visual confirmation.
