-- Phase 10: Growth Track and purpose assessment. Existing course values are
-- validated against the expanded constraint before the old one is replaced.
alter table course add constraint course_course_type_check_v2
  check (course_type in ('sermon_series', 'program', 'growth_track')) not valid;
alter table course validate constraint course_course_type_check_v2;
alter table course drop constraint course_course_type_check;
alter table course rename constraint course_course_type_check_v2 to course_course_type_check;
alter table course add column if not exists position int not null default 0;

create table purpose_assessment_question (
  id uuid primary key default gen_random_uuid(), church_id uuid not null references church(id) on delete cascade,
  question_text text not null,
  category text not null check (category in ('spiritual_gift', 'natural_strength', 'marketplace_interest')),
  options jsonb not null, position int not null default 0
);
create table person_purpose_profile (
  id uuid primary key default gen_random_uuid(), church_id uuid not null references church(id) on delete cascade,
  person_id uuid not null references person(id) on delete cascade unique,
  gifts jsonb not null default '[]', marketplace_calling text, raw_answers jsonb,
  completed_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

alter table purpose_assessment_question enable row level security;
create policy purpose_question_select_in_church on purpose_assessment_question for select using (church_id = current_church_id());
create policy purpose_question_admin_all on purpose_assessment_question for all using (church_id = current_church_id() and current_user_has_role('admin')) with check (church_id = current_church_id() and current_user_has_role('admin'));
alter table person_purpose_profile enable row level security;
create policy purpose_profile_select_self on person_purpose_profile for select using (person_id = current_person_id());
create policy purpose_profile_insert_self on person_purpose_profile for insert with check (church_id = current_church_id() and person_id = current_person_id());
create policy purpose_profile_update_self on person_purpose_profile for update using (person_id = current_person_id()) with check (person_id = current_person_id());
create policy purpose_profile_admin_all on person_purpose_profile for all using (church_id = current_church_id() and current_user_has_role('admin')) with check (church_id = current_church_id() and current_user_has_role('admin'));

-- Stage creation is atomic: a published Growth Track stage always has a
-- first session, preventing an empty course from falsely appearing complete.
create or replace function create_growth_track_stage(
  p_title text, p_position int, p_first_lesson_title text, p_first_lesson_url text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_course_id uuid;
begin
  if not current_user_has_role('admin') then raise exception 'admin role required'; end if;
  if p_position not between 1 and 4 then raise exception 'Growth Track position must be between 1 and 4'; end if;
  if length(trim(p_title)) = 0 or length(trim(p_first_lesson_title)) = 0 then raise exception 'Stage and first lesson titles are required'; end if;
  if exists (select 1 from course where church_id = current_church_id() and course_type = 'growth_track' and position = p_position) then raise exception 'A stage already exists at this position'; end if;
  insert into course (church_id, title, course_type, position, is_published)
  values (current_church_id(), trim(p_title), 'growth_track', p_position, true) returning id into v_course_id;
  insert into lesson (church_id, course_id, position, title, content_type, content_url)
  values (current_church_id(), v_course_id, 1, trim(p_first_lesson_title), 'video', nullif(trim(p_first_lesson_url), ''));
  return v_course_id;
end;
$$;

create or replace function add_growth_track_lesson(
  p_course_id uuid, p_title text, p_content_url text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_lesson_id uuid; v_position int;
begin
  if not current_user_has_role('admin') then raise exception 'admin role required'; end if;
  if not exists (select 1 from course where id = p_course_id and church_id = current_church_id() and course_type = 'growth_track') then raise exception 'Growth Track stage not found'; end if;
  if length(trim(p_title)) = 0 then raise exception 'Lesson title is required'; end if;
  select coalesce(max(position), 0) + 1 into v_position from lesson where course_id = p_course_id;
  insert into lesson (church_id, course_id, position, title, content_type, content_url)
  values (current_church_id(), p_course_id, v_position, trim(p_title), 'video', nullif(trim(p_content_url), '')) returning id into v_lesson_id;
  return v_lesson_id;
end;
$$;
