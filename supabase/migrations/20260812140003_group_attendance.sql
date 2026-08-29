-- Phase 3: per-person attendance for a meeting.
create table group_attendance (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  meeting_id uuid not null references group_meeting(id) on delete cascade,
  person_id uuid not null references person(id) on delete cascade,
  present boolean not null default true,
  unique (meeting_id, person_id)
);
create index idx_group_attendance_meeting on group_attendance(meeting_id);
create index idx_group_attendance_church on group_attendance(church_id);
