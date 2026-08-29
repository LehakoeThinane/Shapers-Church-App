-- Security fix: complete_lesson() accepted a client-supplied p_quiz_score
-- and used it directly to decide pass/fail, even though real grading
-- (submit_quiz_answers(), which never exposes correct_option) is a
-- completely separate call — nothing linked the two together. Any member
-- could call complete_lesson(lesson_id, 100) directly and pass a quiz
-- without answering it, fraudulently unlocking milestone-gated content.
--
-- Fix: submit_quiz_answers() now records its own result into
-- person_progress (the same table complete_lesson() already writes to),
-- and complete_lesson() reads that recorded score back for any lesson
-- that has a quiz. p_quiz_score is kept on complete_lesson()'s signature
-- for call-site compatibility but is no longer trusted for graded lessons
-- — the pass/fail signal now always comes from the server-graded record.

create or replace function submit_quiz_answers(p_quiz_id uuid, p_answers jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_correct int;
  v_score int;
  v_lesson_id uuid;
  v_church_id uuid;
begin
  if auth.uid() is null then
    raise exception 'submit_quiz_answers requires an authenticated caller';
  end if;

  select q.lesson_id, q.church_id into v_lesson_id, v_church_id
  from quiz q
  join lesson l on l.id = q.lesson_id
  where q.id = p_quiz_id and course_visible(l.course_id);

  if v_lesson_id is null then
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

  v_score := round((v_correct::numeric / v_total::numeric) * 100);

  -- Record the graded result server-side so complete_lesson() has a
  -- trustworthy score to check instead of a client-supplied one.
  insert into person_progress (church_id, person_id, lesson_id, quiz_score)
  values (v_church_id, current_person_id(), v_lesson_id, v_score)
  on conflict (person_id, lesson_id)
  do update set quiz_score = excluded.quiz_score;

  return v_score;
end;
$$;

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
  v_recorded_score int;
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
  -- with a quiz only counts as complete once the caller has actually met
  -- it — per the server-graded record from submit_quiz_answers(), never
  -- the p_quiz_score argument the caller passed in.
  select q.passing_score into v_passing_score from quiz q where q.lesson_id = p_lesson_id;

  if v_passing_score is not null then
    select pp.quiz_score into v_recorded_score
    from person_progress pp
    where pp.person_id = v_person_id and pp.lesson_id = p_lesson_id;

    v_passed := v_recorded_score is not null and v_recorded_score >= v_passing_score;
  else
    v_recorded_score := null;
    v_passed := true;
  end if;

  insert into person_progress (church_id, person_id, lesson_id, completed_at, quiz_score)
  values (v_church_id, v_person_id, p_lesson_id, case when v_passed then now() else null end, v_recorded_score)
  on conflict (person_id, lesson_id)
  do update set
    completed_at = case when v_passed then now() else person_progress.completed_at end;

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
