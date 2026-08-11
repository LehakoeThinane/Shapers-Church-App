-- Phase 1: lock the onboarding RPCs down to authenticated callers only.
-- Postgres grants EXECUTE to PUBLIC by default; Supabase's anon/authenticated
-- roles inherit that unless revoked.
revoke execute on function find_church_by_invite_code(text) from public;
revoke execute on function onboard_match_person(uuid, text, text, text, text) from public;

grant execute on function find_church_by_invite_code(text) to authenticated;
grant execute on function onboard_match_person(uuid, text, text, text, text) to authenticated;
