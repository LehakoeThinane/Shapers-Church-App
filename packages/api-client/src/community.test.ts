import { describe, expect, it } from "vitest";
import { createAnnouncement, createEvent, getEvents, getPrayerRequests } from "./community";
import { mockClientFromTables, ok } from "./test-utils";

describe("getEvents", () => {
  it("returns an empty array when there are no events", async () => {
    const client = mockClientFromTables({ event: ok([]) });
    await expect(getEvents(client)).resolves.toEqual([]);
  });

  it("attaches the caller's own RSVP to each event, and null where there isn't one", async () => {
    const event1 = { id: "e1", title: "Sunday Service", starts_at: "2026-08-20" };
    const event2 = { id: "e2", title: "Youth Night", starts_at: "2026-08-21" };
    const rsvp1 = { id: "r1", event_id: "e1", person_id: "p1", status: "going" };
    const client = mockClientFromTables({
      event: ok([event1, event2]),
      event_rsvp: ok([rsvp1]),
    });

    await expect(getEvents(client)).resolves.toEqual([
      { event: event1, myRsvp: rsvp1 },
      { event: event2, myRsvp: null },
    ]);
  });
});

describe("getPrayerRequests", () => {
  it("returns an empty array when there are no requests", async () => {
    const client = mockClientFromTables({ prayer_request: ok([]) });
    await expect(getPrayerRequests(client)).resolves.toEqual([]);
  });

  it("skips the person query entirely when every request is anonymous", async () => {
    const request = { id: "pr1", submitted_by: null, is_anonymous: true, request_text: "..." };
    // Deliberately no "person" entry: if getPrayerRequests queried it
    // anyway despite namedIds being empty, mockClientFromTables would
    // throw "unexpected table: person" and fail this test.
    const client = mockClientFromTables({ prayer_request: ok([request]) });

    await expect(getPrayerRequests(client)).resolves.toEqual([{ request, submitterName: null }]);
  });

  it("resolves a named submitter's display name", async () => {
    const request = { id: "pr1", submitted_by: "p1", is_anonymous: false, request_text: "..." };
    const client = mockClientFromTables({
      prayer_request: ok([request]),
      person: ok([{ id: "p1", first_name: "Ada", last_name: "Lovelace" }]),
    });

    await expect(getPrayerRequests(client)).resolves.toEqual([{ request, submitterName: "Ada Lovelace" }]);
  });

  it("keeps submitterName null for a non-anonymous request whose person row isn't resolvable", async () => {
    const request = { id: "pr1", submitted_by: "p-missing", is_anonymous: false, request_text: "..." };
    const client = mockClientFromTables({
      prayer_request: ok([request]),
      person: ok([]),
    });

    await expect(getPrayerRequests(client)).resolves.toEqual([{ request, submitterName: null }]);
  });
});

describe("createAnnouncement", () => {
  it("sets published_at when publishNow is true", async () => {
    const created = { id: "a1", church_id: "c1", title: "T", body: "B", published_at: "2026-08-01T00:00:00Z" };
    const client = mockClientFromTables({ announcement: ok(created) });

    await expect(
      createAnnouncement(client, { churchId: "c1", title: "T", body: "B", publishNow: true })
    ).resolves.toEqual(created);
  });

  it("leaves published_at null when publishNow is not set (draft)", async () => {
    const created = { id: "a1", church_id: "c1", title: "T", body: "B", published_at: null };
    const client = mockClientFromTables({ announcement: ok(created) });

    await expect(createAnnouncement(client, { churchId: "c1", title: "T", body: "B" })).resolves.toEqual(
      created
    );
  });
});

describe("createEvent", () => {
  it("inserts a new event", async () => {
    const created = { id: "e1", church_id: "c1", title: "Sunday Service", starts_at: "2026-08-20T09:00:00Z" };
    const client = mockClientFromTables({ event: ok(created) });

    await expect(
      createEvent(client, { churchId: "c1", title: "Sunday Service", startsAt: "2026-08-20T09:00:00Z" })
    ).resolves.toEqual(created);
  });
});
