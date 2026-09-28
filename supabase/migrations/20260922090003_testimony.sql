-- Phase 13: Testimony Wall. Approval is server-verified and all normal reads
-- remain scoped to the caller's church.
create table testimony (
  id uuid primary key default gen_random_uuid(), church_id uuid not null references church(id) on delete cascade,
  submitted_by uuid references person(id) on delete set null, title text, body text not null, media_url text,
  is_anonymous boolean not null default false, is_approved boolean not null default false,
  approved_by uuid references person(id) on delete set null, approved_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_testimony_church_approved on testimony(church_id, is_approved, created_at desc);
alter table testimony enable row level security;
create policy testimony_select_approved_in_church on testimony for select using (church_id = current_church_id() and is_approved = true);
create policy testimony_select_self on testimony for select using (submitted_by = current_person_id());
create policy testimony_admin_all on testimony for all using (church_id = current_church_id() and current_user_has_role('admin')) with check (church_id = current_church_id() and current_user_has_role('admin'));
create policy testimony_insert_self on testimony for insert with check (church_id = current_church_id() and submitted_by = current_person_id());

create or replace function approve_testimony(p_testimony_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not current_user_has_role('admin') then raise exception 'admin role required'; end if;
  update testimony set is_approved = true, approved_by = current_person_id(), approved_at = now()
  where id = p_testimony_id and church_id = current_church_id();
  if not found then raise exception 'testimony not found'; end if;
end;
$$;

-- Guest testimony browsing uses this narrow read model rather than a public
-- table policy. Pending stories, submitter identities, and media metadata are
-- deliberately excluded.
create or replace function get_public_testimonies(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id, 'title', t.title, 'body', t.body, 'created_at', t.created_at
  ) order by t.created_at desc), '[]'::jsonb)
  from testimony t join church c on c.id = t.church_id
  where c.slug = lower(trim(p_slug)) and t.is_approved = true;
$$;
grant execute on function get_public_testimonies(text) to anon, authenticated;
