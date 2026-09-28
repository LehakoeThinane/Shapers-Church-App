create extension if not exists pgcrypto;

create table church (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  timezone text not null default 'Africa/Johannesburg',
  invite_code text not null unique default encode(gen_random_bytes(8), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table person (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  first_name text not null,
  last_name text not null default '',
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index person_church_id_idx on person(church_id);

create table app_user (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null unique references person(id) on delete cascade,
  church_id uuid not null references church(id) on delete cascade,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table role_assignment (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  person_id uuid not null references person(id) on delete cascade,
  role text not null check (role in ('admin', 'circuit_leader', 'cell_leader', 'kids_staff', 'guardian', 'member')),
  created_at timestamptz not null default now(),
  unique (church_id, person_id, role)
);
create index role_assignment_person_id_idx on role_assignment(person_id);
