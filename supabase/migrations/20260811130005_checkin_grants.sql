-- Phase 2: lock the check-in RPCs down to authenticated callers only,
-- same reasoning as Phase 1's onboarding grants.
revoke execute on function checkin_scan(text) from public;
revoke execute on function checkin_pickup(uuid, text) from public;

grant execute on function checkin_scan(text) to authenticated;
grant execute on function checkin_pickup(uuid, text) to authenticated;

-- generate_weekly_checkin_tags is a scheduled/admin job, not something
-- any authenticated user should be able to trigger — leave it grantable
-- only to postgres/service_role (the default), don't grant to
-- authenticated or anon.
revoke execute on function generate_weekly_checkin_tags(date) from public;
