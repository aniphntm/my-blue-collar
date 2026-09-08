-- Matches app/api/applications/route.ts. Applicant PII is server-only.
create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (char_length(email) between 3 and 254),
  phone text check (char_length(phone) <= 40),
  location text check (char_length(location) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index candidates_email_lower_unique on public.candidates (lower(email));
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete restrict,
  role_interest text not null check (role_interest in ('go_to_market','operations','engineering')),
  work_background text not null check (char_length(work_background) between 20 and 4000),
  linkedin_url text check (char_length(linkedin_url) <= 500),
  portfolio_url text check (char_length(portfolio_url) <= 500),
  consent_to_contact boolean not null check (consent_to_contact = true),
  consented_at timestamptz not null,
  request_fingerprint text check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  status text not null default 'new' check (status in ('new','reviewing','interviewing','offered','hired','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index applications_candidate_id_idx on public.applications(candidate_id);
create index applications_fingerprint_created_idx on public.applications(request_fingerprint, created_at desc) where request_fingerprint is not null;
create index applications_created_at_idx on public.applications(created_at desc);
alter table public.candidates enable row level security;
alter table public.applications enable row level security;
revoke all on table public.candidates, public.applications from public, anon, authenticated;
grant select, insert, update, delete on table public.candidates, public.applications to service_role;
comment on table public.candidates is 'Hiring candidate PII. Server service role only; no direct browser access.';
comment on table public.applications is 'Hiring submissions. work_background stores the existing versioned answer JSON as text. Server service role only.';
notify pgrst, 'reload schema';
