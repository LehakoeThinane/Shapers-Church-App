-- Security fix: church_select_own let any authenticated member of a
-- church (including a brand-new Tier 1 signup — no invite code needed to
-- reach that state since 20260817120000_membership_tiers.sql) read the
-- full church row via ordinary table access, invite_code included. The
-- admin/invite screens are UI-only gates on top of that — getChurch()
-- itself has no admin check — so any member could read the code straight
-- from the client and self-grant membership via onboard_become_member(),
-- bypassing the "an admin hands this out" model entirely.
--
-- Fix: use PostgREST's column-level privileges (see
-- https://postgrest.org/en/stable/references/auth.html#column-level-privileges)
-- to drop invite_code from what `authenticated` can select on `church`
-- directly, and add get_church_invite_code() as the one admin-checked
-- path to it.
revoke select on church from authenticated;
grant select (id, name, timezone, created_at, updated_at) on church to authenticated;

create or replace function get_church_invite_code(p_church_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if p_church_id is distinct from current_church_id() or not current_user_has_role('admin') then
    raise exception 'admins only';
  end if;

  select invite_code into v_code from church where id = p_church_id;
  return v_code;
end;
$$;

revoke execute on function get_church_invite_code(uuid) from public;
grant execute on function get_church_invite_code(uuid) to authenticated;
