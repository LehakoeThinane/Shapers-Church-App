-- Real seed content for local/dev use, sourced from Shapers Church's own
-- public presence (shaperschurch.com, Instagram, and event flyers shared
-- directly) rather than fabricated placeholder text. Not auto-applied to a
-- remote/hosted project — run manually via the Supabase CLI (`supabase db
-- reset` locally runs this automatically) or paste into Studio's SQL
-- editor, same as any other one-off script in this repo.
--
-- Scoped via the same single-church lookup get_default_church() already
-- uses, so this doesn't need a hardcoded church id — safe to re-run
-- against any project with exactly one church row. announcement/event/
-- course have no unique constraint to key an ON CONFLICT off of, so
-- idempotency here is a plain `where not exists (... title ...)` guard on
-- each insert instead — re-running this script won't create duplicates.

do $$
declare
  v_church_id uuid;
begin
  select id into v_church_id from church order by created_at asc limit 1;

  if v_church_id is null then
    raise exception 'no church row exists yet -- create one first (see README)';
  end if;

  insert into announcement (church_id, title, body, published_at)
  select v_church_id, title, body, now() from (values
    (
      'EPA In Person 2026 — 4 days to go!',
      'You''re invited! Expository Preaching Academy 2026 is happening at Shapers Church this Saturday.

Join Pastor Israel Phiri with guest lecturers Pastor Juan Mosavel, Pastor Bruce Mackenzie, Pastor Bevin Elliott, and Pastor Blaque Nubon as we go deep into Preaching the Psalms — equipping preachers, ministers, leaders, and anyone who wants to know God''s Word with clarity, confidence, and conviction.

Saturday, 22 August 2026, 10:00 AM - 1:00 PM CAT, at Shapers Church, 8 Mellis Road, Rivonia.

EQUIP. EXPOSE. ENCOURAGE.'
    ),
    (
      'Shapers 2026 Conference — pledges open',
      'Family, we are counting down to Conference! A gentle reminder to everyone who hasn''t yet made a Conference pledge — there is still time to prayerfully consider how you''d like to contribute. Reach out to the church office if you''d like to make a pledge.

Let''s continue preparing our hearts, praying, and trusting God for an incredible Conference.'
    )
  ) as seed(title, body)
  where not exists (
    select 1 from announcement a where a.church_id = v_church_id and a.title = seed.title
  );

  insert into event (church_id, title, description, starts_at, ends_at, location)
  select v_church_id, title, description, starts_at, ends_at, location from (values
    (
      'Expository Preaching Academy 2026',
      'Focus: Preaching the Psalms. Equipping preachers to faithfully handle God''s Word and preach with clarity, confidence, and conviction. With Pastor Israel Phiri and guest lecturers.',
      '2026-08-22 10:00:00+02'::timestamptz,
      '2026-08-22 13:00:00+02'::timestamptz,
      '8 Mellis Road, Rivonia'
    ),
    (
      'Shapers 2026 Conference',
      'Theme: The Servant Songs of Isaiah, with Senior Pastor Israel Phiri.',
      '2026-09-03 09:00:00+02'::timestamptz,
      '2026-09-05 18:00:00+02'::timestamptz,
      'Shapers Church, 8 Mellis Road, Rivonia'
    )
  ) as seed(title, description, starts_at, ends_at, location)
  where not exists (
    select 1 from event e where e.church_id = v_church_id and e.title = seed.title
  );

  insert into course (church_id, title, course_type, is_published)
  select v_church_id, 'Shapers Growth Track', 'program', true
  where not exists (
    select 1 from course c where c.church_id = v_church_id and c.title = 'Shapers Growth Track'
  );
end $$;
