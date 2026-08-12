import type { Announcement, EventWithRsvp, PrayerRequest, PrayerRequestForDisplay } from "@shapers/types";
import type { ShapersClient } from "./client";

// GET /announcements — RLS already restricts to published ones.
export async function getAnnouncements(client: ShapersClient): Promise<Announcement[]> {
  const { data, error } = await client
    .from("announcement")
    .select("*")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// GET /events?upcoming=true
export async function getEvents(client: ShapersClient, upcoming = true): Promise<EventWithRsvp[]> {
  let query = client.from("event").select("*").order("starts_at", { ascending: true });
  if (upcoming) query = query.gte("starts_at", new Date().toISOString());
  const { data: events, error: eventsError } = await query;
  if (eventsError) throw eventsError;
  if (!events || events.length === 0) return [];

  const { data: rsvps, error: rsvpsError } = await client
    .from("event_rsvp")
    .select("*")
    .in(
      "event_id",
      events.map((e) => e.id)
    );
  if (rsvpsError) throw rsvpsError;

  const rsvpByEvent = new Map((rsvps ?? []).map((r) => [r.event_id, r]));
  return events.map((event) => ({ event, myRsvp: rsvpByEvent.get(event.id) ?? null }));
}

// POST /events/:id/rsvp { status }
export async function rsvpToEvent(
  client: ShapersClient,
  churchId: string,
  eventId: string,
  personId: string,
  status: "going" | "maybe" | "declined"
): Promise<void> {
  const { error } = await client
    .from("event_rsvp")
    .upsert(
      { church_id: churchId, event_id: eventId, person_id: personId, status },
      { onConflict: "event_id,person_id" }
    );
  if (error) throw error;
}

// GET /prayer-requests — RLS already restricts to the caller's own
// submissions plus everyone's approved ones (or everything, for admin).
// submitterName resolves via the person_select_prayer_submitter policy
// (see supabase/migrations/20260812160004_announcements_events_prayer_rls.sql)
// and is deliberately left null for anonymous requests even though
// submitted_by is still present on the row.
export async function getPrayerRequests(client: ShapersClient): Promise<PrayerRequestForDisplay[]> {
  const { data: requests, error: requestsError } = await client
    .from("prayer_request")
    .select("*")
    .order("created_at", { ascending: false });
  if (requestsError) throw requestsError;
  if (!requests || requests.length === 0) return [];

  const namedIds = requests
    .filter((r) => !r.is_anonymous && r.submitted_by)
    .map((r) => r.submitted_by as string);

  const { data: people, error: peopleError } =
    namedIds.length > 0
      ? await client.from("person").select("id, first_name, last_name").in("id", namedIds)
      : { data: [], error: null };
  if (peopleError) throw peopleError;

  const nameById = new Map((people ?? []).map((p) => [p.id, `${p.first_name} ${p.last_name}`]));
  return requests.map((request) => ({
    request,
    submitterName: request.is_anonymous || !request.submitted_by ? null : nameById.get(request.submitted_by) ?? null,
  }));
}

// POST /prayer-requests { request_text, is_anonymous }
export async function submitPrayerRequest(
  client: ShapersClient,
  churchId: string,
  personId: string,
  requestText: string,
  isAnonymous: boolean
): Promise<PrayerRequest> {
  const { data, error } = await client
    .from("prayer_request")
    .insert({
      church_id: churchId,
      submitted_by: personId,
      request_text: requestText,
      is_anonymous: isAnonymous,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// PATCH /prayer-requests/:id/approve (admin only, per RLS)
export async function approvePrayerRequest(client: ShapersClient, requestId: string): Promise<void> {
  const { error } = await client.from("prayer_request").update({ is_approved: true }).eq("id", requestId);
  if (error) throw error;
}
