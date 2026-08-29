-- Phase 5: announcements, events & prayer (MVP basics — architecture
-- doc Section 7). published_at is nullable so a draft can be created
-- and published later; null or future published_at just means "not
-- visible yet" per the RLS in the next migration.
create table announcement (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  title text not null,
  body text not null,
  published_at timestamptz,
  created_by uuid references person(id),
  created_at timestamptz not null default now()
);
create index idx_announcement_church on announcement(church_id);
