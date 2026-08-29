-- Phase 4: course-taking actions, per the /courses and /lessons/:id/complete
-- endpoints in the handoff doc.

-- GET /courses/:id (question list, without answers)
create or replace function get_quiz_questions(p_quiz_id uuid)
returns table (id uuid, question_text text, options jsonb, "position" int)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from quiz q
    join lesson l on l.id = q.lesson_id
    where q.id = p_quiz_id and course_visible(l.course_id)
  ) then
    raise exception 'quiz not found or not visible';
  end if;

  return query
    select qq.id, qq.question_text, qq.options, qq.position
    from quiz_question qq
    where qq.quiz_id = p_quiz_id
    order by qq.position;
end;
$$;

-- Grades server-side against quiz_question.correct_option, which the
-- client never sees. p_answers is { "<question_id>": "<selected_option>" }.
-- Returns a 0-100 score; the caller passes that straight into
-- complete_lesson() below.
create or replace function submit_quiz_answers(p_quiz_id uuid, p_answers jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_correct int;
begin
  if auth.uid() is null then
    raise exception 'submit_quiz_answers requires an authenticated caller';
  end if;

  if not exists (
    select 1 from quiz q
    join lesson l on l.id = q.lesson_id
    where q.id = p_quiz_id and course_visible(l.course_id)
  ) then
    raise exception 'quiz not found or not visible';
  end if;

  select count(*) into v_total from quiz_question where quiz_id = p_quiz_id;
  if v_total = 0 then
    raise exception 'quiz has no questions';
  end if;

  select count(*) into v_correct
  from quiz_question qq
  where qq.quiz_id = p_quiz_id
    and (p_answers ->> qq.id::text) = qq.correct_option;

  return round((v_correct::numeric / v_total::numeric) * 100);
end;
$$;

-- POST /lessons/:id/complete { quiz_score? }
-- Marks the lesson complete for the caller, then — if this was the
-- last lesson of a course with unlocks_milestone set and the caller
-- doesn't already hold that milestone — records it. Returns the
-- milestone_type if one was newly unlocked, otherwise null. The actual
-- Planning Center write-back happens out-of-band (Database Webhook on
-- person_milestone -> supabase/functions/pc-milestone-sync), same
-- pattern as Phase 2's checkin -> pc-checkin-sync.
create or replace function complete_lesson(p_lesson_id uuid, p_quiz_score int default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_person_id uuid;
  v_course_id uuid;
  v_church_id uuid;
  v_unlocks text;
  v_total_lessons int;
  v_completed_lessons int;
  v_already_has_milestone boolean;
  v_passing_score int;
  v_passed boolean;
begin
  if auth.uid() is null then
    raise exception 'complete_lesson requires an authenticated caller';
  end if;

  v_person_id := current_person_id();

  select l.course_id, l.church_id into v_course_id, v_church_id
  from lesson l where l.id = p_lesson_id;

  if v_course_id is null then
    raise exception 'unknown lesson';
  end if;

  if not course_visible(v_course_id) then
    raise exception 'course not visible';
  end if;

  -- quiz.passing_score exists as a real gate, not decoration: a lesson
  -- with a quiz only counts as complete (and only counts toward
  -- unlocking a milestone) once the caller has actually met it. Caught
  -- by testing this against the real project with a deliberately-wrong
  -- quiz submission — a first version marked the lesson complete
  -- regardless of score.
  select q.passing_score into v_passing_score from quiz q where q.lesson_id = p_lesson_id;
  v_passed := v_passing_score is null or (p_quiz_score is not null and p_quiz_score >= v_passing_score);

  insert into person_progress (church_id, person_id, lesson_id, completed_at, quiz_score)
  values (v_church_id, v_person_id, p_lesson_id, case when v_passed then now() else null end, p_quiz_score)
  on conflict (person_id, lesson_id)
  do update set
    completed_at = case when v_passed then now() else person_progress.completed_at end,
    quiz_score = excluded.quiz_score;

  if not v_passed then
    return null;
  end if;

  select c.unlocks_milestone into v_unlocks from course c where c.id = v_course_id;
  if v_unlocks is null then
    return null;
  end if;

  select count(*) into v_total_lessons from lesson where course_id = v_course_id;
  select count(*) into v_completed_lessons
    from person_progress pp
    join lesson l on l.id = pp.lesson_id
    where l.course_id = v_course_id
      and pp.person_id = v_person_id
      and pp.completed_at is not null;

  if v_completed_lessons < v_total_lessons then
    return null;
  end if;

  select exists (
    select 1 from person_milestone pm
    where pm.person_id = v_person_id and pm.milestone_type = v_unlocks
  ) into v_already_has_milestone;

  if v_already_has_milestone then
    return null;
  end if;

  insert into person_milestone (church_id, person_id, milestone_type, source_course_id, sync_status)
  values (v_church_id, v_person_id, v_unlocks, v_course_id, 'pending');

  return v_unlocks;
end;
$$;
