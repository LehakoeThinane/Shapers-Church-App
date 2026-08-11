-- Phase 2: check-in records. Written by checkin_scan()/checkin_pickup()
-- below, not directly by clients — see 20260811130004_checkin_functions.sql.
create table checkin (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  person_id uuid not null references person(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  security_code text,
  pc_checkin_id text,
  sync_status text not null default 'pending' check (sync_status in ('pending','synced','failed')),
  created_at timestamptz not null default now()
);
create index idx_checkin_person on checkin(person_id);
create index idx_checkin_church_date on checkin(church_id, checked_in_at);
