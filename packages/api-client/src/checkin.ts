import type { CheckinPickupResult, CheckinScanResult, MyCheckinTag, OpenCheckin } from "@shapers/types";
import type { ShapersClient } from "./client";

// GET /checkin-tags/me
// This week's QR tokens for the caller's own children (RLS already
// scopes checkin_tag to the guardian's household — see
// supabase/migrations/20260811130003_checkin_rls.sql).
//
// Two queries rather than a PostgREST embedded select (`person(...)`) —
// the hand-written Database type doesn't model foreign-key
// Relationships (see the note in packages/types/src/database.ts), so
// there's nothing for supabase-js to type an embedded join against.
export async function getMyCheckinTags(client: ShapersClient): Promise<MyCheckinTag[]> {
  const { data: tags, error: tagsError } = await client
    .from("checkin_tag")
    .select("*")
    .order("created_at", { ascending: false });
  if (tagsError) throw tagsError;
  if (!tags || tags.length === 0) return [];

  const personIds = [...new Set(tags.map((t) => t.person_id))];
  const { data: children, error: childrenError } = await client
    .from("person")
    .select("id, first_name, last_name")
    .in("id", personIds);
  if (childrenError) throw childrenError;

  const childById = new Map((children ?? []).map((c) => [c.id, c]));
  return tags.map((tag) => ({
    tag,
    child: childById.get(tag.person_id) ?? { id: tag.person_id, first_name: "Unknown", last_name: "" },
  }));
}

// POST /checkin/scan { qr_token }
export async function scanCheckin(client: ShapersClient, qrToken: string): Promise<CheckinScanResult> {
  const { data, error } = await client.rpc("checkin_scan", { p_qr_token: qrToken });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error("checkin_scan returned no result");
  return {
    checkinId: row.checkin_id,
    personId: row.person_id,
    firstName: row.first_name,
    lastName: row.last_name,
    securityCode: row.security_code,
  };
}

// POST /checkin/:id/pickup { qr_token }
export async function confirmPickup(
  client: ShapersClient,
  checkinId: string,
  qrToken: string
): Promise<CheckinPickupResult> {
  const { data, error } = await client.rpc("checkin_pickup", {
    p_checkin_id: checkinId,
    p_qr_token: qrToken,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error("checkin_pickup returned no result");
  return {
    checkinId: row.checkin_id,
    personId: row.person_id,
    checkedOutAt: row.checked_out_at,
  };
}

// Staff pickup list: children currently checked in (church-wide, per
// checkin_select_kids_staff/admin RLS) with their name for display.
export async function getOpenCheckins(client: ShapersClient): Promise<OpenCheckin[]> {
  const { data: checkins, error: checkinsError } = await client
    .from("checkin")
    .select("*")
    .is("checked_out_at", null)
    .order("checked_in_at", { ascending: true });
  if (checkinsError) throw checkinsError;
  if (!checkins || checkins.length === 0) return [];

  const personIds = [...new Set(checkins.map((c) => c.person_id))];
  const { data: children, error: childrenError } = await client
    .from("person")
    .select("id, first_name, last_name")
    .in("id", personIds);
  if (childrenError) throw childrenError;

  const childById = new Map((children ?? []).map((c) => [c.id, c]));
  return checkins.map((checkin) => ({
    checkin,
    child: childById.get(checkin.person_id) ?? {
      id: checkin.person_id,
      first_name: "Unknown",
      last_name: "",
    },
  }));
}

// GET /checkin/status/:person_id — kids' staff / guardian only (RLS-scoped).
// Most recent check-in row for a person, or null if never checked in.
export async function getCheckinStatus(client: ShapersClient, personId: string) {
  const { data, error } = await client
    .from("checkin")
    .select("*")
    .eq("person_id", personId)
    .order("checked_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
