-- Phase 4: lock the course RPCs down to authenticated callers only,
-- same reasoning as every other RPC grant so far.
revoke execute on function get_quiz_questions(uuid) from public;
revoke execute on function submit_quiz_answers(uuid, jsonb) from public;
revoke execute on function complete_lesson(uuid, int) from public;

grant execute on function get_quiz_questions(uuid) to authenticated;
grant execute on function submit_quiz_answers(uuid, jsonb) to authenticated;
grant execute on function complete_lesson(uuid, int) to authenticated;
