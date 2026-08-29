create table event (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  created_by uuid references person(id),
  created_at timestamptz not null default now()
);
create index idx_event_church_date on event(church_id, starts_at);
