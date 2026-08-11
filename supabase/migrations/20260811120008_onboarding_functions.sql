-- Phase 1: onboarding flow, per docs/shapers-church-app-architecture.md
-- Section 8 and the /onboarding/* endpoints in the handoff doc:
--   sign up -> find/join church -> match to existing PC person
--   (by phone/email) or flag for staff review -> default role 'member'.
--
-- Both functions are SECURITY DEFINER: at the point they're called the
-- caller has no app_user row yet, so current_church_id()/current_person_id()
-- resolve to null and ordinary RLS would block everything. The functions
-- themselves enforce the only invariants that matter here (caller is
-- authenticated, caller doesn't already have an app_user row).

-- POST /onboarding/join-church
-- Looks up a church by invite code. No membership required to call this
-- (the caller isn't a member of anything yet), and it only exposes id/name
-- — never the full church row — so it's safe to run before RLS would
-- otherwise allow the caller to see this church at all.
create or replace function find_church_by_invite_code(p_invite_code text)
returns table (id uuid, name text)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.name
  from church c
  where c.invite_code = p_invite_code;
$$;

-- POST /onboarding/match-person
-- Matches the signed-in auth user to an existing Planning-Center-synced
-- person by phone/email within the given church. If no match is found,
-- creates a new, unsynced person row (pc_person_id stays null — that's
-- the flag staff use to find self-registered people needing manual
-- linking, the "one deliberate human-in-the-loop step" from the arch doc).
-- Either way, links auth.uid() via a new app_user row and grants the
-- default 'member' role.
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

  -- Prefer an existing PC-synced person not yet claimed by any login.
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

  insert into role_assignment (church_id, person_id, role, scope_type, scope_id)
  values (p_church_id, v_person_id, 'member', 'church', p_church_id)
  on conflict do nothing;

  return v_person_id;
end;
$$;
