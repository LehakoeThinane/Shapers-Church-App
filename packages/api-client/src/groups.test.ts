import { describe, expect, it } from "vitest";
import { getCircuitReports, getGroupMembers } from "./groups";
import { mockClientFromTables, ok } from "./test-utils";

describe("getGroupMembers", () => {
  it("returns an empty array when the group has no members", async () => {
    const client = mockClientFromTables({ group_member: ok([]) });
    await expect(getGroupMembers(client, "group-1")).resolves.toEqual([]);
  });

  it("joins each member with its matching person", async () => {
    const client = mockClientFromTables({
      group_member: ok([{ id: "m1", group_id: "group-1", person_id: "p1", role: "member" }]),
      person: ok([{ id: "p1", first_name: "Ada", last_name: "Lovelace" }]),
    });

    await expect(getGroupMembers(client, "group-1")).resolves.toEqual([
      {
        member: { id: "m1", group_id: "group-1", person_id: "p1", role: "member" },
        person: { id: "p1", first_name: "Ada", last_name: "Lovelace" },
      },
    ]);
  });

  it("falls back to an Unknown placeholder when the person row is missing", async () => {
    const client = mockClientFromTables({
      group_member: ok([{ id: "m1", group_id: "group-1", person_id: "p-missing", role: "member" }]),
      person: ok([]),
    });

    const result = await getGroupMembers(client, "group-1");
    expect(result[0]?.person).toEqual({ id: "p-missing", first_name: "Unknown", last_name: "" });
  });
});

describe("getCircuitReports", () => {
  it("returns an empty array when the circuit has no meetings", async () => {
    const client = mockClientFromTables({
      ministry_group: ok([{ id: "circuit-1", parent_group_id: null, name: "Circuit 1" }]),
      group_meeting: ok([]),
    });

    await expect(getCircuitReports(client, "circuit-1")).resolves.toEqual([]);
  });

  it("joins report + meeting + group triples", async () => {
    const group = { id: "cell-1", parent_group_id: "circuit-1", name: "Cell 1" };
    const meeting = { id: "meeting-1", group_id: "cell-1", meeting_date: "2026-08-01" };
    const report = { id: "report-1", meeting_id: "meeting-1", attendance_count: 10 };
    const client = mockClientFromTables({
      ministry_group: ok([group]),
      group_meeting: ok([meeting]),
      group_report: ok([report]),
    });

    await expect(getCircuitReports(client, "circuit-1")).resolves.toEqual([{ report, meeting, group }]);
  });

  it("drops a report whose meeting doesn't resolve to a fetched group", async () => {
    // Guards the flatMap's own defensive check — a report pointing at a
    // meeting/group outside what was fetched should be silently
    // skipped, not shown with undefined fields.
    const meeting = { id: "meeting-1", group_id: "cell-orphan", meeting_date: "2026-08-01" };
    const report = { id: "report-1", meeting_id: "meeting-1", attendance_count: 10 };
    const client = mockClientFromTables({
      ministry_group: ok([{ id: "circuit-1", parent_group_id: null, name: "Circuit 1" }]),
      group_meeting: ok([meeting]),
      group_report: ok([report]),
    });

    await expect(getCircuitReports(client, "circuit-1")).resolves.toEqual([]);
  });
});
