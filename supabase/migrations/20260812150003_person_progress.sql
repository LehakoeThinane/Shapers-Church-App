-- Phase 4: per-person, per-lesson completion.
create table person_progress (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  person_id uuid not null references person(id) on delete cascade,
  lesson_id uuid not null references lesson(id) on delete cascade,
  completed_at timestamptz,
  quiz_score int,
  unique (person_id, lesson_id)
);
create index idx_person_progress_person on person_progress(person_id);
create index idx_person_progress_church on person_progress(church_id);
