-- Phase 1: person. Universal identity — every human, logged in or not.
--
-- email/phone here are contact details pulled in from the Planning Center
-- sync (not present in the original schema.sql) — the onboarding
-- match-person flow needs *something* to match a new signup against an
-- existing PC-synced person before an app_user/login exists at all.
-- These are distinct from app_user.email/phone, which are login credentials
-- set only once someone actually signs up.
create table person (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  household_id uuid references household(id) on delete set null,
  pc_person_id text,
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  is_minor boolean not null default false,
  email text,
  phone text,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_person_church on person(church_id);
create index idx_person_household on person(household_id);
create index idx_person_pc_id on person(pc_person_id);
create index idx_person_email on person(church_id, email);
create index idx_person_phone on person(church_id, phone);
