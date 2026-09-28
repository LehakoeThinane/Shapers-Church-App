-- Phase 8: narrowly scoped guest access. This is additive and exposes no
-- member, household, role, or unpublished event data.
alter table church add column if not exists slug text;
create unique index if not exists idx_church_slug on church (slug) where slug is not null;

create table church_public_content (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  key text not null,
  body text,
  updated_at timestamptz not null default now(),
  unique (church_id, key)
);

alter table church_public_content enable row level security;
create policy church_public_content_admin on church_public_content for all
  using (church_id = current_church_id() and current_user_has_role('admin'))
  with check (church_id = current_church_id() and current_user_has_role('admin'));

-- Security-definer public read model: the public route receives only its
-- selected church's safe content and next event, never raw tenant tables.
create or replace function get_public_church(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'name', c.name, 'slug', c.slug,
    'content', coalesce((select jsonb_object_agg(pc.key, pc.body) from church_public_content pc where pc.church_id = c.id), '{}'::jsonb),
    'next_event', (select jsonb_build_object('title', e.title, 'starts_at', e.starts_at, 'location', e.location) from event e where e.church_id = c.id and e.starts_at >= now() order by e.starts_at asc limit 1)
  ) from church c where c.slug = lower(trim(p_slug));
$$;
grant execute on function get_public_church(text) to anon, authenticated;
