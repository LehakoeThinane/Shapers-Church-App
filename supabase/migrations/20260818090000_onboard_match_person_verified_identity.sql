-- Security fix: onboard_match_person previously matched an existing
-- Planning-Center-synced person using the caller-supplied p_email/p_phone
-- parameters directly, with no proof the caller actually owns that email
-- or phone. Because a match auto-links auth.uid() to that person (who may
-- already hold role_assignment rows, including admin), anyone could claim
-- any synced person's identity just by typing in a known email/phone —
-- no confirmation, no review.
--
-- Fix: matching against an *existing* person now uses only the caller's
-- own verified auth.users email/phone, never the client-supplied params.
-- p_email/p_phone are still accepted, but only ever used to populate a
-- brand-new, unmatched person row (self-reported profile data on a record
-- with no existing roles to inherit) — same as before for that branch.
--
-- Verification only means anything if Supabase actually withholds
-- *_confirmed_at until the address/number is proven — see the paired
-- change to supabase/config.toml (auth.email.enable_confirmations).
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
  v_verified_email text;
  v_verified_phone text;
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

  select
    case when email_confirmed_at is not null then email else null end,
    case when phone_confirmed_at is not null then phone else null end
  into v_verified_email, v_verified_phone
  from auth.users
  where id = auth.uid();

  -- Prefer an existing PC-synced person not yet claimed by any login —
  -- matched only against the caller's own verified contact info.
  select p.id into v_person_id
  from person p
  where p.church_id = p_church_id
    and p.pc_person_id is not null
    and not exists (select 1 from app_user au where au.person_id = p.id)
    and (
      (v_verified_email is not null and p.email = v_verified_email)
      or (v_verified_phone is not null and p.phone = v_verified_phone)
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
