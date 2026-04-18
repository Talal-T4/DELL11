create extension if not exists pgcrypto;

create table if not exists public.access_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  starts_at date not null,
  ends_at date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.access_codes add column if not exists is_temporary boolean not null default false;
alter table public.access_codes add column if not exists expires_at timestamptz;
alter table public.access_codes add column if not exists used_at timestamptz;

create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  access_code_id uuid not null unique references public.access_codes(id) on delete cascade,
  reqs_done jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.discounts (
  id uuid primary key default gen_random_uuid(),
  pct integer not null check (pct >= 1 and pct <= 99),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  access_code_id uuid not null references public.access_codes(id) on delete cascade,
  course_date date not null,
  course_time time not null,
  course_name text not null,
  course_about text not null,
  course_details text not null,
  organizers jsonb not null,
  submitted_at timestamptz not null default now()
);

create index if not exists idx_submissions_access_code_id on public.submissions(access_code_id);
create index if not exists idx_discounts_range on public.discounts(starts_at, ends_at);
create index if not exists idx_access_codes_code on public.access_codes(code);
create index if not exists idx_access_codes_temporary on public.access_codes(is_temporary, expires_at, used_at);

alter table public.access_codes enable row level security;
alter table public.progress enable row level security;
alter table public.discounts enable row level security;
alter table public.notes enable row level security;
alter table public.submissions enable row level security;

-- Netlify Functions use the service role key server-side, so no public browser policies are required.
