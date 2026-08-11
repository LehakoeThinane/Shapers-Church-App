-- Phase 2: check-in actions, per the /checkin/* endpoints in the
-- handoff doc. All three are SECURITY DEFINER for the same reason as
-- Phase 1's onboarding functions: they need to read/write rows the
-- caller has no direct table grant for (checkin_tag lookup by raw
-- token, checkin insert/update), while enforcing their own
-- authorization checks in the function body instead of relying on RLS.

-- Weekly QR generation job (see supabase/functions/qr-token-generate/
-- in the handoff doc's repo structure — intended to be invoked by a
-- scheduled pg_cron job or Edge Function cron, not by client apps).
-- Idempotent: re-running for a week that already has tags just skips
-- the ones that exist (on conflict do nothing).
create or replace function generate_weekly_checkin_tags(
  p_week_start_date date default date_trunc('week', current_date)::date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into checkin_tag (church_id, person_id, week_start_date, qr_token, expires_at)
  select
    p.church_id,
    p.id,
    p_week_start_date,
    encode(gen_random_bytes(24), 'hex'),
    (p_week_start_date + 7)::timestamptz
  from person p
  where p.is_minor = true
  on conflict (person_id, week_start_date) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- POST /checkin/scan { qr_token }
-- Staff-facing drop-off scan. Validates the token, checks the caller
-- holds admin/kids_staff in that child's church, creates the checkin
-- row, and returns a fresh security code for the parent/staff to match
-- at pickup. Actual Planning Center write-back happens out-of-band
-- (Database Webhook -> supabase/functions/pc-checkin-sync, configured
-- once a real PC integration exists — see that function's header
-- comment) rather than inline here, so a slow/down PC API can't block
-- the drop-off line.
create or replace function checkin_scan(p_qr_token text)
returns table (
  checkin_id uuid,
  person_id uuid,
  first_name text,
  last_name text,
  security_code text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tag checkin_tag%rowtype;
  v_person person%rowtype;
  v_security_code text;
  v_checkin_id uuid;
begin
  if auth.uid() is null then
    raise exception 'checkin_scan requires an authenticated caller';
  end if;

  select * into v_tag from checkin_tag where qr_token = p_qr_token;
  if v_tag.id is null then
    raise exception 'unrecognized QR code';
  end if;
  if v_tag.expires_at < now() then
    raise exception 'this QR code has expired';
  end if;

  if not exists (
    select 1 from role_assignment ra
    where ra.person_id = current_person_id()
      and ra.church_id = v_tag.church_id
      and ra.role in ('admin', 'kids_staff')
  ) then
    raise exception 'not authorized to check in children';
  end if;

  select * into v_person from person where id = v_tag.person_id;

  v_security_code := lpad(floor(random() * 10000)::int::text, 4, '0');

  insert into checkin (church_id, person_id, security_code, sync_status)
  values (v_tag.church_id, v_tag.person_id, v_security_code, 'pending')
  returning id into v_checkin_id;

  return query
    select v_checkin_id, v_person.id, v_person.first_name, v_person.last_name, v_security_code;
end;
$$;

-- POST /checkin/:id/pickup { qr_token }
-- Staff scans the child's tag again at pickup; this just confirms the
-- token still belongs to the person on that open checkin row before
-- releasing them (the actual custody/authorized-pickup validation
-- already happened at drop-off via Planning Center — this is a match
-- check, not a re-validation of who's allowed to collect the child).
create or replace function checkin_pickup(p_checkin_id uuid, p_qr_token text)
returns table (
  checkin_id uuid,
  person_id uuid,
  checked_out_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_checkin checkin%rowtype;
  v_tag checkin_tag%rowtype;
  v_checked_out_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'checkin_pickup requires an authenticated caller';
  end if;

  select * into v_checkin from checkin where id = p_checkin_id;
  if v_checkin.id is null then
    raise exception 'unknown check-in';
  end if;
  if v_checkin.checked_out_at is not null then
    raise exception 'this check-in has already been picked up';
  end if;

  if not exists (
    select 1 from role_assignment ra
    where ra.person_id = current_person_id()
      and ra.church_id = v_checkin.church_id
      and ra.role in ('admin', 'kids_staff')
  ) then
    raise exception 'not authorized to release children at pickup';
  end if;

  select * into v_tag from checkin_tag
    where checkin_tag.person_id = v_checkin.person_id and checkin_tag.qr_token = p_qr_token;
  if v_tag.id is null then
    raise exception 'QR code does not match this check-in';
  end if;

  update checkin set checked_out_at = now()
    where checkin.id = p_checkin_id
    returning checkin.checked_out_at into v_checked_out_at;

  return query select v_checkin.id, v_checkin.person_id, v_checked_out_at;
end;
$$;
