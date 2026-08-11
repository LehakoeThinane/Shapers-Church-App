-- Phase 1: row-level security for the identity & tenancy tables.
-- Pattern from docs/schema.sql, expanded per the permissions matrix in
-- docs/shapers-church-app-architecture.md Section 6. Later phases add
-- policies for their own tables the same way — tenant isolation first,
-- then role-specific grants layered on top.

-- ---------------------------------------------------------------
-- church
-- ---------------------------------------------------------------
alter table church enable row level security;

-- Members can see their own church once app_user links them to one.
-- (Pre-onboarding lookup by invite code goes through the SECURITY DEFINER
-- find_church_by_invite_code() function instead, since at that point the
-- caller has no church_id yet for this policy to match against.)
create policy church_select_own on church
  for select
  using (id = current_church_id());

create policy church_update_admin on church
  for update
  using (id = current_church_id() and current_user_has_role('admin'));

-- ---------------------------------------------------------------
-- household (read-only in the app; written only by the PC sync worker,
-- which uses the service_role key and therefore bypasses RLS entirely)
-- ---------------------------------------------------------------
alter table household enable row level security;

create policy household_select on household
  for select
  using (
    church_id = current_church_id()
    and (
      current_user_has_role('admin')
      or id = (select household_id from person where id = current_person_id())
      or current_user_has_role('guardian', 'household', id)
    )
  );

-- ---------------------------------------------------------------
-- person
-- ---------------------------------------------------------------
alter table person enable row level security;

create policy person_select_self on person
  for select
  using (id = current_person_id());

create policy person_select_admin on person
  for select
  using (church_id = current_church_id() and current_user_has_role('admin'));

create policy person_select_guardian_household on person
  for select
  using (
    church_id = current_church_id()
    and household_id is not null
    and current_user_has_role('guardian', 'household', household_id)
  );

-- Person rows are otherwise written by the PC sync worker (service_role)
-- or by the onboard_match_person() function below. No direct
-- insert/update/delete policy is granted to authenticated users.

-- ---------------------------------------------------------------
-- app_user
-- ---------------------------------------------------------------
alter table app_user enable row level security;

create policy app_user_select_self on app_user
  for select
  using (id = auth.uid());

create policy app_user_select_admin on app_user
  for select
  using (church_id = current_church_id() and current_user_has_role('admin'));

-- No direct insert policy — rows are created by onboard_match_person(),
-- which runs SECURITY DEFINER so it can validate the match before linking
-- an auth user to a person.

-- ---------------------------------------------------------------
-- role_assignment
-- ---------------------------------------------------------------
alter table role_assignment enable row level security;

create policy role_assignment_select_self on role_assignment
  for select
  using (person_id = current_person_id());

create policy role_assignment_select_admin on role_assignment
  for select
  using (church_id = current_church_id() and current_user_has_role('admin'));

create policy role_assignment_admin_write on role_assignment
  for all
  using (church_id = current_church_id() and current_user_has_role('admin'))
  with check (church_id = current_church_id() and current_user_has_role('admin'));
