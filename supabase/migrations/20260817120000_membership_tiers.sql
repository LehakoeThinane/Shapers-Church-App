-- Two-tier access: signing up no longer requires an invite code (single-
-- church deployment, so the church auto-resolves) and no longer grants
-- the 'member' role automatically. The invite code is repurposed as a
-- membership invite: redeeming it via onboard_become_member() is what
-- grants 'member', which unlocks courses + the prayer wall. Groups and
-- check-in are untouched — already gated by actual group membership /
-- staff roles, not this tier.

-- Lets a caller with no app_user row yet (pre-onboarding) resolve "the"
-- church without an invite code, same SECURITY DEFINER shape as
-- find_church_by_invite_code.
create or replace function get_default_church()
returns table (id uuid, name text)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.name from church c order by c.created_at asc limit 1;
$$;

-- Redefine: drop the automatic 'member' role grant. This now purely
-- joins the caller to the church (Tier 1) — becoming a member is a
-- separate, later step via onboard_become_member().
create or replace function onboard_match_person(
  p_church_id uuid,
  p_first_name text,
  p_last_name text,
  p_phone text default null,
  p_email text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_person_id uuid;
begin
  if auth.uid() is null then
    raise exception 'onboard_match_person requires an authenticated caller';
  end if;

  if exists (select 1 from app_user where id = auth.uid()) then
    raise exception 'this login is already linked to a person';
  end if;

  if not exists (select 1 from church where id = p_church_id) then
    raise exception 'unknown church';
  end if;

  select p.id into v_person_id
  from person p
  where p.church_id = p_church_id
    and p.pc_person_id is not null
    and not exists (select 1 from app_user au where au.person_id = p.id)
    and (
      (p_email is not null and p.email = p_email)
      or (p_phone is not null and p.phone = p_phone)
    )
  order by p.synced_at desc nulls last
  limit 1;

  if v_person_id is null then
    insert into person (church_id, first_name, last_name, phone, email, is_minor)
    values (p_church_id, p_first_name, p_last_name, p_phone, p_email, false)
    returning id into v_person_id;
  end if;

  insert into app_user (id, person_id, church_id, email, phone)
  values (auth.uid(), v_person_id, p_church_id, p_email, p_phone);

  return v_person_id;
end;
$$;

-- POST /become-member (repurposed invite code). Requires the caller
-- already completed onboard_match_person — this only ever adds a role
-- to an existing app_user, it never creates one.
create or replace function onboard_become_member(p_invite_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code_church_id uuid;
  v_caller_person_id uuid;
  v_caller_church_id uuid;
begin
  if auth.uid() is null then
    raise exception 'onboard_become_member requires an authenticated caller';
  end if;

  select id into v_code_church_id from church where invite_code = p_invite_code;
  if v_code_church_id is null then
    raise exception 'invalid invite code';
  end if;

  select person_id, church_id into v_caller_person_id, v_caller_church_id
  from app_user where id = auth.uid();

  if v_caller_person_id is null then
    raise exception 'complete onboarding before becoming a member';
  end if;

  if v_code_church_id <> v_caller_church_id then
    raise exception 'invite code does not match your church';
  end if;

  insert into role_assignment (church_id, person_id, role, scope_type, scope_id)
  values (v_caller_church_id, v_caller_person_id, 'member', 'church', v_caller_church_id)
  on conflict do nothing;
end;
$$;

revoke execute on function get_default_church() from public;
revoke execute on function onboard_become_member(text) from public;

grant execute on function get_default_church() to authenticated;
grant execute on function onboard_become_member(text) to authenticated;

-- ---------------------------------------------------------------
-- RLS: courses and prayer wall now require the 'member' role.
-- announcement/event/event_rsvp/groups/checkin are unaffected — those
-- stay open to any app_user (Tier 1) or are already gated by actual
-- group membership / staff roles.
-- ---------------------------------------------------------------

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
      and (
        (c.is_published = true and current_user_has_role('member'))
        or current_user_has_role('admin')
      )
  );
$$;

drop policy if exists course_select_published on course;
create policy course_select_published on course
  for select
  using (
    church_id = current_church_id()
    and is_published = true
    and current_user_has_role('member')
  );

drop policy if exists prayer_request_insert_self on prayer_request;
create policy prayer_request_insert_self on prayer_request
  for insert
  with check (
    church_id = current_church_id()
    and submitted_by = current_person_id()
    and current_user_has_role('member')
  );

drop policy if exists prayer_request_select_approved on prayer_request;
create policy prayer_request_select_approved on prayer_request
  for select
  using (
    church_id = current_church_id()
    and is_approved = true
    and current_user_has_role('member')
  );
