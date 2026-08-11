-- Phase 1: tenancy root. Every other table hangs off church_id.
create table church (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Africa/Johannesburg',
  invite_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
