-- Matches app/api/plaid/{link-token,exchange,onboarding}/route.ts. Bank onboarding data is server-only.
-- An attempt is anonymous until a returning-login factor exists; its opaque id doubles as the Plaid client_user_id.
create table public.bank_onboarding_attempts (
  id uuid primary key default gen_random_uuid(),
  environment text not null default 'sandbox' check (environment in ('sandbox','production')),
  plaid_client_user_id text not null unique check (plaid_client_user_id ~ '^bw_[A-Za-z0-9_-]{32}$'),
  -- SHA-256 of the secret held only in the attempt's HttpOnly cookie, so a database read cannot resume an attempt.
  secret_hash text not null check (secret_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'created' check (status in ('created','exchanging','verified','needs_review','rejected','failed')),
  status_reason text check (char_length(status_reason) <= 64),
  request_fingerprint text check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bank_onboarding_attempts_fingerprint_created_idx
  on public.bank_onboarding_attempts (request_fingerprint, created_at desc) where request_fingerprint is not null;

-- Only attempts that end verified or needs_review keep a connection; rejected items are removed at the provider.
create table public.bank_connections (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.bank_onboarding_attempts(id) on delete restrict,
  environment text not null check (environment in ('sandbox','production')),
  plaid_item_id text not null check (char_length(plaid_item_id) between 1 and 128),
  plaid_account_id text not null check (char_length(plaid_account_id) between 1 and 128),
  institution_name text check (char_length(institution_name) <= 120),
  account_name text not null check (char_length(account_name) <= 120),
  account_mask text check (account_mask ~ '^[0-9A-Za-z]{1,8}$'),
  account_subtype text not null check (account_subtype in ('checking','savings','cash management')),
  ownership_status text not null check (ownership_status in ('verified','needs_review')),
  ownership_name_score smallint check (ownership_name_score between 0 and 100),
  -- AES-256-GCM envelope (see lib/server/crypto/secret-box.ts); null once the provider item is removed.
  access_token_ciphertext text,
  encryption_key_version smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (environment, plaid_item_id),
  unique (environment, plaid_account_id)
);

-- Append-only: service_role may insert and read, never update or delete.
create table public.bank_onboarding_events (
  -- Monotonic, so event order is deterministic even when two events share a timestamp.
  id bigint generated always as identity primary key,
  attempt_id uuid not null references public.bank_onboarding_attempts(id) on delete restrict,
  event text not null check (event in (
    'attempt_created','link_token_issued','exchange_started','account_ineligible',
    'ownership_verified','ownership_needs_review','ownership_rejected','provider_error'
  )),
  reason text check (char_length(reason) <= 64),
  created_at timestamptz not null default now()
);
create index bank_onboarding_events_attempt_idx on public.bank_onboarding_events (attempt_id, created_at);

alter table public.bank_onboarding_attempts enable row level security;
alter table public.bank_connections enable row level security;
alter table public.bank_onboarding_events enable row level security;
revoke all on table public.bank_onboarding_attempts, public.bank_connections, public.bank_onboarding_events from public, anon, authenticated;
grant select, insert, update on table public.bank_onboarding_attempts, public.bank_connections to service_role;
grant select, insert on table public.bank_onboarding_events to service_role;
comment on table public.bank_onboarding_attempts is 'Anonymous bank-link attempts. Server service role only; no direct browser access.';
comment on table public.bank_connections is 'Masked bank metadata plus an encrypted provider token. Never store raw account or routing numbers. Server service role only.';
comment on table public.bank_onboarding_events is 'Append-only audit trail for bank onboarding. Server service role only.';
notify pgrst, 'reload schema';
