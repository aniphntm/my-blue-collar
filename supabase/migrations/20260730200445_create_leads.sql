-- Leads captured from the waitlist form on the marketing site.
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

alter table public.leads enable row level security;

-- Public form submissions: anyone can insert a lead, no one can read/update/delete
-- through the client. Leads are viewed via the Supabase dashboard Table Editor.
create policy "Allow public lead submissions"
on public.leads
for insert
to anon
with check (true);
