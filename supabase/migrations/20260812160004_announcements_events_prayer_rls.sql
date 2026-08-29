-- Phase 5: RLS for announcement, event, event_rsvp, prayer_request.
-- Per the permissions matrix (architecture doc Section 6):
--   announcements: create admin-only; view is anyone in-church, once
--     published (published_at set and not in the future).
--   events: view is anyone in-church (no draft/publish concept here,
--     unlike announcements); RSVP is everyone, for themselves only.
--   prayer requests: submit is everyone; view is the submitter's own
--     (regardless of approval) plus anyone's once approved; "moderated
--     view — admin only sees unapproved" per the handoff doc's
--     GET /prayer-requests contract falls out of admin's blanket
--     admin_all policy already covering unapproved rows.
--
-- No RPCs in this phase — plain RLS-gated table access covers every
-- action here without needing to bypass RLS for anything.

-- ---------------------------------------------------------------
-- announcement
-- ---------------------------------------------------------------
alter table announcement enable row level security;

create policy announcement_admin_all on announcement
  for all
  using (church_id = current_church_id() and current_user_has_role('admin'))
  with check (church_id = current_church_id() and current_user_has_role('admin'));

create policy announcement_select_published on announcement
  for select
  using (
    church_id = current_church_id()
    and published_at is not null
    and published_at <= now()
  );

-- ---------------------------------------------------------------
-- event
-- ---------------------------------------------------------------
alter table event enable row level security;

create policy event_admin_all on event
  for all
  using (church_id = current_church_id() and current_user_has_role('admin'))
  with check (church_id = current_church_id() and current_user_has_role('admin'));

create policy event_select on event
  for select
  using (church_id = current_church_id());

-- ---------------------------------------------------------------
-- event_rsvp
-- ---------------------------------------------------------------
alter table event_rsvp enable row level security;

create policy event_rsvp_admin_all on event_rsvp
  for all
  using (church_id = current_church_id() and current_user_has_role('admin'))
  with check (church_id = current_church_id() and current_user_has_role('admin'));

create policy event_rsvp_select_self on event_rsvp
  for select
  using (person_id = current_person_id());

create policy event_rsvp_insert_self on event_rsvp
  for insert
  with check (church_id = current_church_id() and person_id = current_person_id());

create policy event_rsvp_update_self on event_rsvp
  for update
  using (person_id = current_person_id())
  with check (person_id = current_person_id());

-- ---------------------------------------------------------------
-- prayer_request
-- ---------------------------------------------------------------
alter table prayer_request enable row level security;

create policy prayer_request_admin_all on prayer_request
  for all
  using (church_id = current_church_id() and current_user_has_role('admin'))
  with check (church_id = current_church_id() and current_user_has_role('admin'));

create policy prayer_request_select_own on prayer_request
  for select
  using (submitted_by = current_person_id());

create policy prayer_request_select_approved on prayer_request
  for select
  using (church_id = current_church_id() and is_approved = true);

create policy prayer_request_insert_self on prayer_request
  for insert
  with check (church_id = current_church_id() and submitted_by = current_person_id());

-- ---------------------------------------------------------------
-- person — extends Phase 1's policies again (same gap class as Phase
-- 2's kids_staff fix and Phase 3's group-leader/fellow-member fixes):
-- displaying "submitted by <name>" on an approved, non-anonymous
-- prayer request needs the viewer to have RLS visibility into the
-- submitter's person row, which nothing so far grants unless they
-- happen to be self/admin/guardian/groupmate. Added proactively this
-- time instead of waiting to find it via live testing.
-- ---------------------------------------------------------------
create policy person_select_prayer_submitter on person
  for select
  using (
    church_id = current_church_id()
    and exists (
      select 1 from prayer_request pr
      where pr.submitted_by = person.id
        and pr.is_approved = true
        and pr.is_anonymous = false
    )
  );
