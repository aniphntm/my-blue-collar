-- Reviewed schema proposal; not applied by the implementation branch.
-- Apply through a versioned Supabase migration before registering webhooks.
begin;
create table public.payment_event_receipts (
  provider text not null check (provider in ('stripe', 'alchemy')),
  event_id text not null,
  scope text not null,
  event_type text not null,
  object_id text,
  live boolean not null,
  received_at timestamptz not null default now(),
  primary key (provider, live, scope, event_id)
);
alter table public.payment_event_receipts enable row level security;
revoke all on public.payment_event_receipts from public, anon, authenticated;
grant select, insert on public.payment_event_receipts to service_role;
comment on table public.payment_event_receipts is
  'Verified provider receipt journal only; not a ledger or authorization to release funds.';
commit;
