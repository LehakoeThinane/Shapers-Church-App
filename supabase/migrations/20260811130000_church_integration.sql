-- Phase 2: per-church Planning Center OAuth credentials. Pulled forward
-- from the "Integrations & Sync" section of docs/schema.sql because the
-- check-in write-back function (this phase) depends on it existing —
-- the rest of that section (sync_field_map, generalized two-way sync)
-- stays deferred to its own phase.
create table church_integration (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  provider text not null check (provider in ('planning_center')),
  encrypted_token text not null,
  connected_by uuid references person(id),
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  status text not null default 'active' check (status in ('active','token_expired','error')),
  unique (church_id, provider)
);
