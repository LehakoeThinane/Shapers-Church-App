-- is_approved: moderation gate before others can see it (architecture
-- doc / schema.sql comment) — enforced in the RLS migration next.
-- is_anonymous only controls display (hide the submitter's name in the
-- UI); submitted_by is always stored so admins can still follow up.
create table prayer_request (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  submitted_by uuid references person(id),
  request_text text not null,
  is_anonymous boolean not null default false,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_prayer_request_church on prayer_request(church_id);
