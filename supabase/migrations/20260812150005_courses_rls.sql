-- Phase 4: RLS for course, lesson, quiz, quiz_question, person_progress,
-- person_milestone.
--
-- quiz_question gets NO select policy for ordinary members at all —
-- only admin_all. correct_option would otherwise be readable by anyone
-- who can see the quiz, which defeats the point of a graded quiz.
-- Reads go through get_quiz_questions() (excludes correct_option) and
-- grading happens server-side in submit_quiz_answers() — see
-- 20260812150006_courses_functions.sql. This is a deliberate departure
-- from a literal reading of docs/schema.sql, which implies the client
-- computes its own quiz_score and just reports it.
--
-- course_visible() is SECURITY DEFINER for the same recursion-avoidance
-- reason as Phase 3's can_view_group()/can_lead_group().

create or replace function course_visible(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from course c
    where c.id = p_course_id
      and c.church_id = current_church_id()
      and (c.is_published = true or current_user_has_role('admin'))
  );
$$;

-- ---------------------------------------------------------------
-- course
-- ---------------------------------------------------------------
alter table course enable row level security;

create policy course_admin_all on course
  for all
  using (church_id = current_church_id() and current_user_has_role('admin'))
  with check (church_id = current_church_id() and current_user_has_role('admin'));

create policy course_select_published on course
  for select
  using (church_id = current_church_id() and is_published = true);

-- ---------------------------------------------------------------
-- lesson
-- ---------------------------------------------------------------
alter table lesson enable row level security;

create policy lesson_admin_all on lesson
  for all
  using (church_id = current_church_id() and current_user_has_role('admin'))
  with check (church_id = current_church_id() and current_user_has_role('admin'));

create policy lesson_select on lesson
  for select
  using (church_id = current_church_id() and course_visible(course_id));

-- ---------------------------------------------------------------
-- quiz
-- ---------------------------------------------------------------
alter table quiz enable row level security;

create policy quiz_admin_all on quiz
  for all
  using (church_id = current_church_id() and current_user_has_role('admin'))
  with check (church_id = current_church_id() and current_user_has_role('admin'));

create policy quiz_select on quiz
  for select
  using (
    church_id = current_church_id()
    and exists (
      select 1 from lesson l where l.id = quiz.lesson_id and course_visible(l.course_id)
    )
  );

-- ---------------------------------------------------------------
-- quiz_question — admin only; everyone else reads via
-- get_quiz_questions(), which never returns correct_option.
-- ---------------------------------------------------------------
alter table quiz_question enable row level security;

create policy quiz_question_admin_all on quiz_question
  for all
  using (church_id = current_church_id() and current_user_has_role('admin'))
  with check (church_id = current_church_id() and current_user_has_role('admin'));

-- ---------------------------------------------------------------
-- person_progress — no insert policy for authenticated: writes go
-- through complete_lesson(), which also handles milestone unlocking.
-- ---------------------------------------------------------------
alter table person_progress enable row level security;

create policy person_progress_admin_all on person_progress
  for all
  using (church_id = current_church_id() and current_user_has_role('admin'))
  with check (church_id = current_church_id() and current_user_has_role('admin'));

create policy person_progress_select_self on person_progress
  for select
  using (person_id = current_person_id());

-- ---------------------------------------------------------------
-- person_milestone
-- ---------------------------------------------------------------
alter table person_milestone enable row level security;

create policy person_milestone_admin_all on person_milestone
  for all
  using (church_id = current_church_id() and current_user_has_role('admin'))
  with check (church_id = current_church_id() and current_user_has_role('admin'));

create policy person_milestone_select_self on person_milestone
  for select
  using (person_id = current_person_id());

create policy person_milestone_select_guardian on person_milestone
  for select
  using (
    exists (
      select 1 from person p
      where p.id = person_milestone.person_id
        and p.household_id is not null
        and current_user_has_role('guardian', 'household', p.household_id)
    )
  );
