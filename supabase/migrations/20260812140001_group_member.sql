-- Phase 3: membership. is_primary distinguishes someone's main
-- department from a secondary committee seat (architecture doc Section 3).
--
-- church_id: docs/schema.sql's reference version of this table has no
-- church_id column, unlike every other tenant-owned table — that reads
-- like an oversight against the doc's own stated convention ("every
-- tenant-owned table carries church_id directly... so RLS policies stay
-- simple and fast") rather than a deliberate exception, so it's added
-- here. Same call for group_meeting/group_attendance/group_report below.
create table group_member (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  group_id uuid not null references ministry_group(id) on delete cascade,
  person_id uuid not null references person(id) on delete cascade,
  role text not null default 'member' check (role in ('leader','assistant','member')),
  is_primary boolean not null default true,
  joined_at timestamptz not null default now(),
  unique (group_id, person_id)
);
create index idx_group_member_person on group_member(person_id);
create index idx_group_member_church on group_member(church_id);
