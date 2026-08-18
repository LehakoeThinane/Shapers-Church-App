-- Documentation fix, no behavior change: security_code (generated in
-- checkin_scan(), see 20260811130004_checkin_functions.sql) is a
-- human-visual matching aid for staff at pickup — the parent is shown
-- the code at drop-off and shows it again at pickup for staff to eyeball
-- against the "currently checked in" list. checkin_pickup() never reads
-- or validates it; the actual pickup authorization is the QR token match
-- plus the caller holding admin/kids_staff in that child's church. The
-- column name invites an assumption worth heading off: that it's a real
-- second factor. It isn't, and it isn't generated with crypto-strength
-- randomness either (plain random(), 10,000 possibilities) — appropriate
-- for a human-eyeballed code, not for anything re-validated by the
-- system.
comment on column checkin.security_code is
  'Human-visual matching aid shown to the parent at drop-off and re-shown at pickup for staff to eyeball -- NOT re-validated by checkin_pickup() or anything else server-side. Pickup authorization is the QR token match plus the caller holding admin/kids_staff. Generated with plain random(), not crypto-strength -- do not treat as a real second factor.';

comment on function checkin_pickup(uuid, text) is
  'Confirms the scanned QR token still matches the open check-in before releasing the child, and that the caller holds admin/kids_staff. Does NOT check checkin.security_code -- see the comment on that column.';
