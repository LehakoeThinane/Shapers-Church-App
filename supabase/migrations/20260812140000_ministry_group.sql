-- Phase 3: groups (circuits, cells, departments, committees — unified).
-- Named `ministry_group` because `group` is a reserved word — see
-- docs/schema.sql header note.
create table ministry_group (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  parent_group_id uuid references ministry_group(id) on delete set null,
  group_type text not null check (group_type in ('circuit','cell','department','committee')),
  name text not null,
  leader_person_id uuid references person(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_group_church on ministry_group(church_id);
create index idx_group_parent on ministry_group(parent_group_id);
