-- Phase 4: optional graded quiz on a lesson.
create table quiz (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  lesson_id uuid not null unique references lesson(id) on delete cascade,
  passing_score int not null default 70,
  created_at timestamptz not null default now()
);
create index idx_quiz_church on quiz(church_id);

-- correct_option is deliberately NOT readable by ordinary members —
-- see the RLS migration's header note. Grading happens server-side via
-- submit_quiz_answers(), not by the client computing its own score
-- against data it was handed.
create table quiz_question (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  quiz_id uuid not null references quiz(id) on delete cascade,
  question_text text not null,
  options jsonb not null,
  correct_option text not null,
  position int not null default 0
);
create index idx_quiz_question_quiz on quiz_question(quiz_id);
create index idx_quiz_question_church on quiz_question(church_id);
