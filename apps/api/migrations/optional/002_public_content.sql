-- Optional post-demo schema.
-- The Sunday APK only requires migrations/001_identity.sql for
-- church/person/app_user/role_assignment authentication and /me.
-- Apply this migration later when public content, events, sermons, and
-- testimonies endpoints are intentionally enabled.

create table church_public_content (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  key text not null check (key in ('mission_statement', 'what_to_expect', 'beliefs')),
  body text,
  updated_at timestamptz not null default now(),
  unique (church_id, key)
);

create table event (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);
create index event_upcoming_idx on event(church_id, starts_at);

create table sermon (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  title text not null,
  speaker_name text not null,
  scripture_reference text,
  video_url text,
  audio_url text,
  thumbnail_url text,
  duration_seconds int check (duration_seconds is null or duration_seconds > 0),
  is_downloadable boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  check (video_url is not null or audio_url is not null)
);
create index sermon_public_idx on sermon(church_id, published_at desc) where published_at is not null;

create table testimony (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  submitted_by uuid references person(id) on delete set null,
  title text,
  body text not null,
  media_url text,
  is_anonymous boolean not null default false,
  is_approved boolean not null default false,
  approved_by uuid references person(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);
create index testimony_public_idx on testimony(church_id, created_at desc) where is_approved;
