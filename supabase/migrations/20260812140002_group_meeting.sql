-- Phase 3: one row per meeting instance for a group.
create table group_meeting (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  group_id uuid not null references ministry_group(id) on delete cascade,
  meeting_date date not null,
  location text,
  created_at timestamptz not null default now()
);
create index idx_group_meeting_group on group_meeting(group_id);
create index idx_group_meeting_church on group_meeting(church_id);
