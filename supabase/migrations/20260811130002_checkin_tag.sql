-- Phase 2: weekly rotating QR tokens — no printer hardware dependency,
-- old screenshots/printouts stop working once the week rolls over
-- (enforced by expires_at, not by regenerating on every scan).
create table checkin_tag (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  person_id uuid not null references person(id) on delete cascade,
  week_start_date date not null,
  qr_token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (person_id, week_start_date)
);
create index idx_checkin_tag_token on checkin_tag(qr_token);
