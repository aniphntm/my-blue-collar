-- Private durable inbox: acknowledge only after insertion, deduplicate by event ID.
create table public.telnyx_webhook_events (
  event_id text primary key,
  event_type text not null check (event_type in ('message.received', 'message.sent', 'message.finalized')),
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  event jsonb not null
);
alter table public.telnyx_webhook_events enable row level security;
revoke all on public.telnyx_webhook_events from anon, authenticated;
grant select, insert on public.telnyx_webhook_events to service_role;
create index telnyx_webhook_events_received_at_idx on public.telnyx_webhook_events(received_at);

-- A dedicated random 256-bit inbox token grants only insert/deduplication access.
-- Its SHA-256 hash is safe to version; the token itself exists only in server env.
create function public.receive_telnyx_event(p_secret text, p_event jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_secret is null or pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p_secret, 'UTF8')), 'hex')
    <> '8080d8dcda99bc2f1a5f47137ce428566a69abb5b0befeec7246c4e5630ab95f' then
    raise exception 'Invalid inbox credential' using errcode = '42501';
  end if;
  if p_event #>> '{data,id}' is null or length(p_event #>> '{data,id}') not between 1 and 200
    or p_event #>> '{data,event_type}' is null
    or p_event #>> '{data,event_type}' not in ('message.received', 'message.sent', 'message.finalized')
    or jsonb_typeof(p_event #> '{data,payload}') is distinct from 'object' then
    raise exception 'Invalid event envelope' using errcode = '22023';
  end if;
  insert into public.telnyx_webhook_events(event_id, event_type, occurred_at, event)
    values (p_event #>> '{data,id}', p_event #>> '{data,event_type}',
      (p_event #>> '{data,occurred_at}')::timestamptz, p_event)
    on conflict (event_id) do nothing;
end;
$$;
revoke all on function public.receive_telnyx_event(text, jsonb) from public;
grant execute on function public.receive_telnyx_event(text, jsonb) to anon, service_role;
