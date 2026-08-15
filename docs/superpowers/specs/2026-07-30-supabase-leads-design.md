# Supabase leads capture — design

## Context

The MyBlueCollar landing page (`web/`) has a waitlist form (`components/waitlist-form.tsx`, rendered inside `components/join.tsx`) that currently only flips local React state on submit — nothing is persisted. This spec covers standing up a Supabase table to capture these leads and wiring the form to actually submit into it.

Supabase project already exists:
- URL: `https://hqscogrqifqrpnsbojte.supabase.co`
- Publishable key: provided by user, goes in `web/.env.local` (gitignored, never committed)

No Supabase CLI or MCP server is available in this environment, so the migration SQL is handed to the user to run manually in the Supabase SQL editor rather than applied programmatically.

## Schema

Single table, `public.leads`, matching the form fields:

```sql
create table public.leads (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null,
  business text not null,
  email text not null unique,
  phone text,
  trade text not null
    check (trade in (
      'Electrical', 'HVAC', 'Plumbing', 'Roofing',
      'Flooring', 'Landscaping', 'Painting', 'Remodeling', 'Other'
    )),
  employees text not null
    check (employees in ('Just me', '2–5', '6–15', '16–30', '30+')),
  location text not null,
  jobs_per_month text not null
    check (jobs_per_month in ('1–10', '11–30', '31–75', '75+')),
  current_software text,
  subcontractor_interest boolean not null default false
);

create index leads_email_idx on public.leads (email);
```

Design choices:
- `id bigint generated always as identity` — sequential, compact, avoids the index fragmentation of random UUIDs. There's no need to expose or merge these IDs across systems, so UUID's distributed-system benefits don't apply here.
- `email text unique` — a second submission with an already-used email fails at the DB level (409/23505 unique-violation error code), matching the "reject duplicates" decision.
- `trade`, `employees`, `jobs_per_month` are `text` with `CHECK` constraints enumerating the exact option values from the form's `<select>` elements. This is defense in depth: the frontend dropdown already constrains input, but the CHECK stops bad data from a direct API call (e.g. via devtools) bypassing the form.
- `phone` and `current_software` are nullable `text`, matching the optional form fields.
- `subcontractor_interest boolean not null default false` matches the checkbox.

## Row Level Security

```sql
alter table public.leads enable row level security;

create policy "Allow public lead submissions"
on public.leads
for insert
to anon
with check (true);
```

- RLS is enabled, with exactly one policy: `anon` can `insert`, unconditionally.
- No `select`/`update`/`delete` policy exists for `anon` (or `authenticated`), so the publishable key can only add rows, never read or modify existing leads back out through the client. Leads are viewed via the Supabase dashboard's Table Editor.
- Because the app never reads rows back with the public key, there's no per-row filtering to worry about (the usual `auth.uid()` pattern doesn't apply — there's no authenticated user model here).

## App wiring

- `web/.env.local` (gitignored): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. A `.env.local.example` with blank values is committed so the shape is documented.
- New dependency: `@supabase/supabase-js`, pinned to a specific version in `package.json` with `package-lock.json` committed.
- `web/lib/supabase.ts` — exports a single browser Supabase client built from the two env vars.
- `web/components/waitlist-form.tsx` — `handleSubmit` becomes async: reads the form's `FormData`, inserts a row into `leads` (mapping `jobsPerMonth` → `jobs_per_month`, `currentSoftware` → `current_software`, `subcontractorInterest` → `subcontractor_interest`, and coercing the checkbox to a boolean), then:
  - On success → show the existing "You're on the list!" confirmation.
  - On a unique-violation error (Postgres code `23505`) → show a friendly "You're already on the list!" message (not a raw error), since this is an expected case, not a failure.
  - On any other error → show an inline error message near the submit button and let the user retry; stay on the form (don't show the success state).
- The migration SQL lives at `web/supabase/migrations/<timestamp>_create_leads.sql`, matching the naming convention the Supabase CLI would use, so it's ready to pick up automatically if the CLI is added to this project later. The user runs it manually in the Supabase SQL editor since no CLI/MCP is available here.

## Testing

- Manual verification via the running dev server: submit the form with valid data → confirm a row appears in Supabase's Table Editor and the success UI shows.
- Submit again with the same email → confirm the "already on the list" message shows (not a crash or raw error).
- Submit with a required field missing → confirm the browser's native `required` validation blocks submission (unchanged existing behavior).
- No automated test suite exists in `web/` currently; this stays consistent with that (no test framework introduced as part of this change).
