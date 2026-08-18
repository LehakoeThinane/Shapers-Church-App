-- Small data-minimization gap from the audit: members could submit an
-- RSVP or a prayer request but never retract it themselves — only an
-- admin could remove either. Adds self-delete, matching the existing
-- self-scoped select/insert(/update) policies on these tables.
create policy event_rsvp_delete_self on event_rsvp
  for delete
  using (person_id = current_person_id());

create policy prayer_request_delete_self on prayer_request
  for delete
  using (submitted_by = current_person_id());
