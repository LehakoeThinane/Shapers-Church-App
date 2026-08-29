-- church_id added — docs/schema.sql's reference version omits it, same
-- oversight-against-its-own-convention call made for every other
-- child table so far (Phase 3's group tables, Phase 4's lesson/quiz).
create table event_rsvp (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  event_id uuid not null references event(id) on delete cascade,
  person_id uuid not null references person(id) on delete cascade,
  status text not null default 'going' check (status in ('going','maybe','declined')),
  created_at timestamptz not null default now(),
  unique (event_id, person_id)
);
create index idx_event_rsvp_event on event_rsvp(event_id);
create index idx_event_rsvp_church on event_rsvp(church_id);
