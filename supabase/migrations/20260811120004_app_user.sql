-- Phase 1: login. Not every person has one (children don't).
-- id matches Supabase auth.users.id.
create table app_user (
  id uuid primary key references auth.users(id) on delete cascade,
  person_id uuid not null unique references person(id) on delete cascade,
  church_id uuid not null references church(id) on delete cascade,
  email text unique,
  phone text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_app_user_church on app_user(church_id);
