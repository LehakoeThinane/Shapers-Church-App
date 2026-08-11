-- Phase 1: auth helper functions used by RLS policies.
--
-- These are SECURITY DEFINER and marked stable so they run once per
-- statement and bypass RLS on app_user/role_assignment internally —
-- without that, a policy on app_user that queries app_user (even
-- transitively through these helpers) would recurse into itself.

create or replace function current_person_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select person_id from app_user where id = auth.uid();
$$;

create or replace function current_church_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select church_id from app_user where id = auth.uid();
$$;

-- True if the current user holds `role_name`, optionally scoped to a
-- specific scope_type/scope_id. Pass null scope args to check for an
-- unscoped or any-scope grant of that role.
create or replace function current_user_has_role(
  role_name text,
  check_scope_type text default null,
  check_scope_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from role_assignment ra
    where ra.person_id = current_person_id()
      and ra.role = role_name
      and (check_scope_type is null or ra.scope_type = check_scope_type)
      and (check_scope_id is null or ra.scope_id = check_scope_id)
  );
$$;
