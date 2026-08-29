-- Phase 2: RLS for church_integration, checkin, checkin_tag. Per the
-- permissions matrix (architecture doc Section 6): check-in create is
-- admin/kids_staff (any child, church-wide) or guardian (own children
-- only); integration settings are admin-only.
--
-- checkin/checkin_tag get no insert/update/delete policy for
-- `authenticated` — every write goes through the SECURITY DEFINER RPCs
-- in the next migration, same pattern as onboard_match_person in Phase 1.
-- kids_staff deliberately gets no direct SELECT on checkin_tag either:
-- scanning resolves a token via checkin_scan() without needing to browse
-- other children's QR tokens directly.

-- ---------------------------------------------------------------
-- person (extends Phase 1's policies — kids_staff had no visibility
-- into `person` at all yet, but the pickup screen needs child names
-- for the "currently checked in" list; matches the permissions matrix's
-- "Own child, check-in only" scope for kids_staff by restricting to
-- minors, not general person browsing)
-- ---------------------------------------------------------------
create policy person_select_kids_staff on person
  for select
  using (
    church_id = current_church_id()
    and is_minor = true
    and current_user_has_role('kids_staff')
  );

-- ---------------------------------------------------------------
-- church_integration
-- ---------------------------------------------------------------
alter table church_integration enable row level security;

create policy church_integration_admin_only on church_integration
  for all
  using (church_id = current_church_id() and current_user_has_role('admin'))
  with check (church_id = current_church_id() and current_user_has_role('admin'));

-- ---------------------------------------------------------------
-- checkin
-- ---------------------------------------------------------------
alter table checkin enable row level security;

create policy checkin_select_admin on checkin
  for select
  using (church_id = current_church_id() and current_user_has_role('admin'));

create policy checkin_select_kids_staff on checkin
  for select
  using (church_id = current_church_id() and current_user_has_role('kids_staff'));

create policy checkin_select_guardian on checkin
  for select
  using (
    church_id = current_church_id()
    and exists (
      select 1 from person p
      where p.id = checkin.person_id
        and p.household_id is not null
        and current_user_has_role('guardian', 'household', p.household_id)
    )
  );

-- ---------------------------------------------------------------
-- checkin_tag
-- ---------------------------------------------------------------
alter table checkin_tag enable row level security;

create policy checkin_tag_select_admin on checkin_tag
  for select
  using (church_id = current_church_id() and current_user_has_role('admin'));

create policy checkin_tag_select_guardian on checkin_tag
  for select
  using (
    church_id = current_church_id()
    and exists (
      select 1 from person p
      where p.id = checkin_tag.person_id
        and p.household_id is not null
        and current_user_has_role('guardian', 'household', p.household_id)
    )
  );
