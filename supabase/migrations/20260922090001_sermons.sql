-- Phase 9: sermons. Published sermons remain tenant-scoped for signed-in
-- members; a future public sermon endpoint must be a slug-scoped read model.
create table sermon (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  series_course_id uuid references course(id) on delete set null,
  title text not null, speaker_name text not null, scripture_reference text,
  video_url text, audio_url text, thumbnail_url text, duration_seconds int,
  is_downloadable boolean not null default true, published_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_sermon_church_published on sermon(church_id, published_at);

alter table sermon enable row level security;
create policy sermon_select_published_in_church on sermon for select
  using (church_id = current_church_id() and published_at is not null and published_at <= now());
create policy sermon_admin_all on sermon for all
  using (church_id = current_church_id() and current_user_has_role('admin'))
  with check (church_id = current_church_id() and current_user_has_role('admin'));

-- Guest access is scoped by the public church slug. This function never
-- returns draft sermons or records belonging to a different slug.
create or replace function get_public_sermons(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id, 'title', s.title, 'speaker_name', s.speaker_name,
    'scripture_reference', s.scripture_reference, 'video_url', s.video_url,
    'audio_url', s.audio_url, 'thumbnail_url', s.thumbnail_url,
    'duration_seconds', s.duration_seconds, 'published_at', s.published_at
  ) order by s.published_at desc), '[]'::jsonb)
  from sermon s join church c on c.id = s.church_id
  where c.slug = lower(trim(p_slug)) and s.published_at is not null and s.published_at <= now();
$$;
grant execute on function get_public_sermons(text) to anon, authenticated;
