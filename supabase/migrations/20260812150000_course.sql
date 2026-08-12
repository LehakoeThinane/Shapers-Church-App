-- Phase 4: courses, quizzes & milestones. One schema for both casual
-- sermon-series companion content and gated formal programs (baptism,
-- membership) — see architecture doc Section 5. unlocks_milestone is
-- null for casual content, set (e.g. 'baptism') for gated programs.
create table course (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  title text not null,
  course_type text not null check (course_type in ('sermon_series','program')),
  unlocks_milestone text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_course_church on course(church_id);
