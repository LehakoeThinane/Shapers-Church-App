-- Shapers Church App — full schema
-- Target: Postgres via Supabase
-- Notes:
--   * "group" and "user" are reserved words in Postgres, so those entities
--     are named `ministry_group` and `app_user` throughout.
--   * Every tenant-owned table carries church_id directly (not derived via
--     joins) so row-level security policies stay simple and fast.
--   * RLS pattern is shown once at the bottom — apply the same shape to
--     every table below, then layer role-specific policies on top per the
--     permissions matrix in the main architecture doc.
--
-- This file is the full end-state reference schema across all 7 build
-- phases (see docs/shapers-developer-handoff.md). It is not applied
-- directly — supabase/migrations/ splits it into ordered, phase-by-phase
-- migration files as each phase is actually built.

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. IDENTITY & TENANCY
-- ============================================================

create table church (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Africa/Johannesburg',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Read-only in the app; populated by the Planning Center sync worker.
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

-- Universal identity — every human, logged in or not.
create table person (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  household_id uuid references household(id) on delete set null,
  pc_person_id text,
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  is_minor boolean not null default false,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_person_church on person(church_id);
create index idx_person_household on person(household_id);
create index idx_person_pc_id on person(pc_person_id);

-- Login. Not every person has one (children don't).
-- id matches Supabase auth.users.id.
create table app_user (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null unique references person(id) on delete cascade,
  church_id uuid not null references church(id) on delete cascade,
  email text unique,
  phone text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A person can hold multiple role assignments, each scoped independently.
create table role_assignment (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  person_id uuid not null references person(id) on delete cascade,
  role text not null check (role in
    ('admin','circuit_leader','cell_leader','kids_staff','guardian','member')),
  scope_type text check (scope_type in ('church','circuit','cell','household')),
  scope_id uuid, -- references ministry_group.id or household.id depending on scope_type
  created_at timestamptz not null default now(),
  unique (person_id, role, scope_type, scope_id)
);
create index idx_role_assignment_person on role_assignment(person_id);

-- ============================================================
-- 2. CHECK-IN
-- ============================================================

create table checkin (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  person_id uuid not null references person(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  security_code text,
  pc_checkin_id text,
  sync_status text not null default 'pending' check (sync_status in ('pending','synced','failed')),
  created_at timestamptz not null default now()
);
create index idx_checkin_person on checkin(person_id);
create index idx_checkin_church_date on checkin(church_id, checked_in_at);

-- Weekly rotating QR tokens — no printer hardware dependency.
create table checkin_tag (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  person_id uuid not null references person(id) on delete cascade,
  week_start_date date not null,
  qr_token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (person_id, week_start_date)
);
create index idx_checkin_tag_token on checkin_tag(qr_token);

-- ============================================================
-- 3. GROUPS (circuits, cells, departments, committees — unified)
-- ============================================================

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

create table group_member (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references ministry_group(id) on delete cascade,
  person_id uuid not null references person(id) on delete cascade,
  role text not null default 'member' check (role in ('leader','assistant','member')),
  is_primary boolean not null default true,
  joined_at timestamptz not null default now(),
  unique (group_id, person_id)
);
create index idx_group_member_person on group_member(person_id);

create table group_meeting (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references ministry_group(id) on delete cascade,
  meeting_date date not null,
  location text,
  created_at timestamptz not null default now()
);
create index idx_group_meeting_group on group_meeting(group_id);

create table group_attendance (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references group_meeting(id) on delete cascade,
  person_id uuid not null references person(id) on delete cascade,
  present boolean not null default true,
  unique (meeting_id, person_id)
);

create table group_report (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null unique references group_meeting(id) on delete cascade,
  attendance_count int,
  offering_amount numeric(10,2),
  testimonies text,
  is_exception boolean not null default false, -- drives notification triggers
  submitted_by uuid references person(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 4. COURSES, QUIZZES & MILESTONES
-- ============================================================

create table course (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  title text not null,
  course_type text not null check (course_type in ('sermon_series','program')),
  unlocks_milestone text, -- e.g. 'baptism', 'membership'; null = no gating
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lesson (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references course(id) on delete cascade,
  position int not null,
  title text not null,
  content_type text not null check (content_type in ('video','text','pdf')),
  content_url text,
  created_at timestamptz not null default now()
);
create index idx_lesson_course on lesson(course_id);

create table quiz (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null unique references lesson(id) on delete cascade,
  passing_score int not null default 70,
  created_at timestamptz not null default now()
);

create table quiz_question (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quiz(id) on delete cascade,
  question_text text not null,
  options jsonb not null, -- [{ "key": "a", "text": "..." }, ...]
  correct_option text not null,
  position int not null default 0
);

create table person_progress (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references person(id) on delete cascade,
  lesson_id uuid not null references lesson(id) on delete cascade,
  completed_at timestamptz,
  quiz_score int,
  unique (person_id, lesson_id)
);

create table person_milestone (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  person_id uuid not null references person(id) on delete cascade,
  milestone_type text not null, -- 'baptism', 'membership', 'confirmation', etc.
  achieved_at date not null default current_date,
  source_course_id uuid references course(id) on delete set null,
  sync_status text not null default 'pending' check (sync_status in ('pending','synced','failed')),
  pc_synced_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_milestone_person on person_milestone(person_id);

-- ============================================================
-- 5. ANNOUNCEMENTS, EVENTS & PRAYER (MVP basics)
-- ============================================================

create table announcement (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  title text not null,
  body text not null,
  published_at timestamptz,
  created_by uuid references person(id),
  created_at timestamptz not null default now()
);

create table event (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  created_by uuid references person(id),
  created_at timestamptz not null default now()
);
create index idx_event_church_date on event(church_id, starts_at);

create table event_rsvp (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references event(id) on delete cascade,
  person_id uuid not null references person(id) on delete cascade,
  status text not null default 'going' check (status in ('going','maybe','declined')),
  created_at timestamptz not null default now(),
  unique (event_id, person_id)
);

create table prayer_request (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  submitted_by uuid references person(id),
  request_text text not null,
  is_anonymous boolean not null default false,
  is_approved boolean not null default false, -- moderation gate before others can see it
  created_at timestamptz not null default now()
);

-- ============================================================
-- 6. INTEGRATIONS & SYNC
-- ============================================================

create table church_integration (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  provider text not null check (provider in ('planning_center')),
  encrypted_token text not null,
  connected_by uuid references person(id),
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  status text not null default 'active' check (status in ('active','token_expired','error')),
  unique (church_id, provider)
);

create table sync_field_map (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  local_table text not null,
  local_field text not null,
  remote_field text not null,
  direction text not null check (direction in ('push','pull','both')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 7. NOTIFICATIONS
-- ============================================================

create table notification (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  recipient_person_id uuid not null references person(id) on delete cascade,
  type text not null, -- e.g. 'group_report_exception', 'milestone_achieved', 'announcement'
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notification_recipient on notification(recipient_person_id, read_at);

create table notification_preference (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references person(id) on delete cascade,
  notification_type text not null,
  push_enabled boolean not null default true,
  unique (person_id, notification_type)
);

-- ============================================================
-- 8. OPERATIONAL RELIABILITY
-- ============================================================

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  actor_person_id uuid references person(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_church_date on audit_log(church_id, created_at);

-- ============================================================
-- ROW-LEVEL SECURITY — pattern (apply to every table above)
-- ============================================================
-- Every request runs with app.current_church_id set from the authenticated
-- user's JWT claims. Base tenant isolation policy, shown on `person` as the
-- template — repeat this shape per table, then add role-specific policies
-- on top per the permissions matrix in the main architecture doc.

alter table person enable row level security;

create policy tenant_isolation_person on person
  using (church_id = current_setting('app.current_church_id')::uuid);

-- Example of a role-specific policy layered on top (kids' staff can view
-- check-in status church-wide, but nothing else about a person):
-- create policy kids_staff_checkin_view on checkin
--   for select
--   using (
--     church_id = current_setting('app.current_church_id')::uuid
--     and exists (
--       select 1 from role_assignment ra
--       where ra.person_id = current_setting('app.current_person_id')::uuid
--       and ra.role = 'kids_staff'
--     )
--   );
