-- Phase 3: rolls up a meeting into the numbers leadership actually
-- reviews (architecture doc Section 3: "routine reports land quietly in
-- dashboards; only defined exceptions... trigger a push notification").
-- is_exception is set by the submitter for now (zero attendance /
-- notable offering drop / testimony needing follow-up); wiring it to an
-- actual notification is Phase 6.
create table group_report (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  meeting_id uuid not null unique references group_meeting(id) on delete cascade,
  attendance_count int,
  offering_amount numeric(10,2),
  testimonies text,
  is_exception boolean not null default false,
  submitted_by uuid references person(id),
  created_at timestamptz not null default now()
);
create index idx_group_report_church on group_report(church_id);
