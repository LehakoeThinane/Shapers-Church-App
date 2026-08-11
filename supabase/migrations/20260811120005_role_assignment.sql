-- Phase 1: roles are not exclusive — a person can hold multiple role
-- assignments at once, each scoped independently (e.g. guardian *and*
-- cell leader). scope_id references ministry_group.id or household.id
-- depending on scope_type; ministry_group doesn't exist until Phase 3,
-- so no FK on scope_id (matches original schema.sql design).
create table role_assignment (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  person_id uuid not null references person(id) on delete cascade,
  role text not null check (role in
    ('admin','circuit_leader','cell_leader','kids_staff','guardian','member')),
  scope_type text check (scope_type in ('church','circuit','cell','household')),
  scope_id uuid,
  created_at timestamptz not null default now(),
  unique (person_id, role, scope_type, scope_id)
);
create index idx_role_assignment_person on role_assignment(person_id);
create index idx_role_assignment_church on role_assignment(church_id);
