-- Phase 1: household. Read-only in the app; populated by the Planning
-- Center sync worker (Phase 2+). No insert/update/delete policies are
-- granted to authenticated users — see RLS migration.
create table household (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  pc_household_id text,
  name text,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_household_church on household(church_id);
