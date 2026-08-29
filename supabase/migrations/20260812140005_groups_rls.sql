-- Phase 3: RLS for ministry_group, group_member, group_meeting,
-- group_attendance, group_report. Per the permissions matrix
-- (architecture doc Section 6):
--   view:   admin (all) / circuit_leader (own circuit's groups) /
--           cell_leader (own group) / member (own group, if member)
--   report submit: cell_leader (own group) only in the matrix, but
--           admin gets full CRUD everywhere else in this schema, so
--           admin can submit too — treating the matrix's blank cells
--           as "not the expected pathway" rather than a hard block,
--           consistent with every other admin_all policy so far.
--   report view: admin (all) / circuit_leader (own circuit) /
--           cell_leader (own group) — NOT member, stricter than
--           general group visibility above.
--
-- can_view_group()/can_lead_group() are SECURITY DEFINER for a reason
-- that isn't just style: a first version of this file had
-- ministry_group's member-visibility policy query group_member, and
-- group_member's own policy query back into ministry_group — Postgres
-- detected that as infinite recursion (42P17) the moment two people
-- actually existed to trigger both policies in the same statement,
-- not something a schema-only smoke test would ever catch. Routing
-- both checks through SECURITY DEFINER functions (same reason
-- current_person_id()/current_user_has_role() are SECURITY DEFINER —
-- see Phase 1's auth_helpers.sql) breaks the cycle: their internal
-- queries bypass RLS instead of re-entering it.

create or replace function can_view_group(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from ministry_group mg
    where mg.id = p_group_id
      and mg.church_id = current_church_id()
      and (
        current_user_has_role('admin')
        or current_user_has_role('cell_leader', 'cell', mg.id)
        or exists (
          select 1 from role_assignment ra
          where ra.person_id = current_person_id()
            and ra.role = 'circuit_leader'
            and ra.scope_type = 'circuit'
            and (ra.scope_id = mg.id or ra.scope_id = mg.parent_group_id)
        )
        or exists (
          select 1 from group_member gm
          where gm.group_id = mg.id and gm.person_id = current_person_id()
        )
      )
  );
$$;

-- Same as can_view_group() but without the plain-member branch — used
-- for actions (logging meetings, taking attendance) and for
-- group_report visibility, which the matrix restricts to leadership.
create or replace function can_lead_group(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from ministry_group mg
    where mg.id = p_group_id
      and mg.church_id = current_church_id()
      and (
        current_user_has_role('admin')
        or current_user_has_role('cell_leader', 'cell', mg.id)
        or exists (
          select 1 from role_assignment ra
          where ra.person_id = current_person_id()
            and ra.role = 'circuit_leader'
            and ra.scope_type = 'circuit'
            and (ra.scope_id = mg.id or ra.scope_id = mg.parent_group_id)
        )
      )
  );
$$;

-- ---------------------------------------------------------------
-- person (extends Phase 1's policies — same gap class as Phase 2's
-- kids_staff addition: circuit_leader/cell_leader had no visibility
-- into `person` at all, so the member roster UI resolved every
-- fellow member's name to "Unknown" despite group_member itself
-- being visible)
-- ---------------------------------------------------------------
create policy person_select_group_leader on person
  for select
  using (
    church_id = current_church_id()
    and exists (
      select 1 from group_member gm
      where gm.person_id = person.id and can_lead_group(gm.group_id)
    )
  );

-- Plain members too — "view own group" (the matrix's phrase) means
-- seeing who else is in it, same as any real cell roster.
create policy person_select_fellow_member on person
  for select
  using (
    church_id = current_church_id()
    and exists (
      select 1 from group_member gm1
      join group_member gm2 on gm2.group_id = gm1.group_id
      where gm1.person_id = current_person_id()
        and gm2.person_id = person.id
    )
  );

-- ---------------------------------------------------------------
-- ministry_group
-- ---------------------------------------------------------------
alter table ministry_group enable row level security;

create policy group_admin_all on ministry_group
  for all
  using (church_id = current_church_id() and current_user_has_role('admin'))
  with check (church_id = current_church_id() and current_user_has_role('admin'));

create policy group_select_visible on ministry_group
  for select
  using (church_id = current_church_id() and can_view_group(id));

-- ---------------------------------------------------------------
-- group_member
-- ---------------------------------------------------------------
alter table group_member enable row level security;

create policy group_member_admin_all on group_member
  for all
  using (church_id = current_church_id() and current_user_has_role('admin'))
  with check (church_id = current_church_id() and current_user_has_role('admin'));

create policy group_member_select on group_member
  for select
  using (church_id = current_church_id() and can_view_group(group_id));

-- ---------------------------------------------------------------
-- group_meeting
-- ---------------------------------------------------------------
alter table group_meeting enable row level security;

create policy group_meeting_admin_all on group_meeting
  for all
  using (church_id = current_church_id() and current_user_has_role('admin'))
  with check (church_id = current_church_id() and current_user_has_role('admin'));

create policy group_meeting_select on group_meeting
  for select
  using (church_id = current_church_id() and can_view_group(group_id));

-- Logging a meeting is a leadership action: cell_leader for their own
-- group, or circuit_leader for any group in their circuit.
create policy group_meeting_insert_leader on group_meeting
  for insert
  with check (church_id = current_church_id() and can_lead_group(group_id));

-- ---------------------------------------------------------------
-- group_attendance
-- ---------------------------------------------------------------
alter table group_attendance enable row level security;

create policy group_attendance_admin_all on group_attendance
  for all
  using (church_id = current_church_id() and current_user_has_role('admin'))
  with check (church_id = current_church_id() and current_user_has_role('admin'));

create policy group_attendance_select on group_attendance
  for select
  using (
    church_id = current_church_id()
    and exists (
      select 1 from group_meeting m
      where m.id = group_attendance.meeting_id and can_view_group(m.group_id)
    )
  );

create policy group_attendance_insert_leader on group_attendance
  for insert
  with check (
    church_id = current_church_id()
    and exists (
      select 1 from group_meeting m
      where m.id = group_attendance.meeting_id and can_lead_group(m.group_id)
    )
  );

-- The app upserts attendance (re-marking after the fact is normal), and
-- Postgres requires UPDATE privileges for the INSERT ... ON CONFLICT DO
-- UPDATE path structurally — checked for every row regardless of
-- whether that row actually conflicts — so an insert-only policy here
-- 403s even on rows with no real conflict.
create policy group_attendance_update_leader on group_attendance
  for update
  using (
    church_id = current_church_id()
    and exists (
      select 1 from group_meeting m
      where m.id = group_attendance.meeting_id and can_lead_group(m.group_id)
    )
  )
  with check (
    church_id = current_church_id()
    and exists (
      select 1 from group_meeting m
      where m.id = group_attendance.meeting_id and can_lead_group(m.group_id)
    )
  );

-- ---------------------------------------------------------------
-- group_report — deliberately stricter than general group visibility:
-- admin / circuit_leader (own circuit) / cell_leader (own group) only,
-- not plain members. Uses can_lead_group(), not can_view_group().
-- ---------------------------------------------------------------
alter table group_report enable row level security;

create policy group_report_admin_all on group_report
  for all
  using (church_id = current_church_id() and current_user_has_role('admin'))
  with check (church_id = current_church_id() and current_user_has_role('admin'));

create policy group_report_select_leader on group_report
  for select
  using (
    church_id = current_church_id()
    and exists (
      select 1 from group_meeting m
      where m.id = group_report.meeting_id and can_lead_group(m.group_id)
    )
  );

-- Submission itself stays cell_leader-only (narrower than
-- can_lead_group, which also admits circuit_leader) — matches the
-- matrix's explicit "Group reports (submit): cell_leader only" cell,
-- unlike the read side where every leadership role should see reports.
create policy group_report_insert_cell_leader on group_report
  for insert
  with check (
    church_id = current_church_id()
    and exists (
      select 1 from group_meeting m
      join ministry_group mg on mg.id = m.group_id
      where m.id = group_report.meeting_id
        and current_user_has_role('cell_leader', 'cell', mg.id)
    )
  );
