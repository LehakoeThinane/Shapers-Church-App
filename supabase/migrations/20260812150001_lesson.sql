-- Phase 4: ordered content within a course. church_id added here (and
-- on quiz/quiz_question/person_progress below) for the same reason as
-- Phase 3's group tables — docs/schema.sql's reference versions omit
-- it, which reads as an oversight against the doc's own "every
-- tenant-owned table carries church_id directly" convention.
create table lesson (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  course_id uuid not null references course(id) on delete cascade,
  position int not null,
  title text not null,
  content_type text not null check (content_type in ('video','text','pdf')),
  content_url text,
  created_at timestamptz not null default now()
);
create index idx_lesson_course on lesson(course_id);
create index idx_lesson_church on lesson(church_id);
