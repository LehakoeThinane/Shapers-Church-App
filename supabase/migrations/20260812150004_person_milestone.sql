-- Phase 4: generic achievement record — not hardcoded to
-- baptism/membership, any future milestone is just a new milestone_type
-- value (architecture doc Section 5). Staff can also backfill this
-- manually without a course, so source_course_id stays nullable.
create table person_milestone (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  person_id uuid not null references person(id) on delete cascade,
  milestone_type text not null,
  achieved_at date not null default current_date,
  source_course_id uuid references course(id) on delete set null,
  sync_status text not null default 'pending' check (sync_status in ('pending','synced','failed')),
  pc_synced_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_milestone_person on person_milestone(person_id);
create index idx_milestone_church on person_milestone(church_id);
