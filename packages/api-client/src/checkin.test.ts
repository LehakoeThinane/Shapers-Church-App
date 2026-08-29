import { describe, expect, it, vi } from "vitest";
import type { ShapersClient } from "./client";
import { confirmPickup, getMyCheckinTags, getOpenCheckins, scanCheckin } from "./checkin";
import { mockClientFromTables, ok } from "./test-utils";

describe("getMyCheckinTags", () => {
  it("returns an empty array when there are no tags", async () => {
    const client = mockClientFromTables({ checkin_tag: ok([]) });
    await expect(getMyCheckinTags(client)).resolves.toEqual([]);
  });

  it("joins each tag with its matching child", async () => {
    const client = mockClientFromTables({
      checkin_tag: ok([{ id: "tag-1", person_id: "child-1", qr_token: "abc" }]),
      person: ok([{ id: "child-1", first_name: "Ada", last_name: "Lovelace" }]),
    });

    await expect(getMyCheckinTags(client)).resolves.toEqual([
      {
        tag: { id: "tag-1", person_id: "child-1", qr_token: "abc" },
        child: { id: "child-1", first_name: "Ada", last_name: "Lovelace" },
      },
    ]);
  });

  it("falls back to an Unknown placeholder when the child row is missing", async () => {
    // Guards the exact class of bug this join is prone to: a person row
    // deleted or not (yet) visible under RLS shouldn't crash the tag
    // list or silently drop the tag — it should render a placeholder.
    const client = mockClientFromTables({
      checkin_tag: ok([{ id: "tag-1", person_id: "child-missing", qr_token: "abc" }]),
      person: ok([]),
    });

    await expect(getMyCheckinTags(client)).resolves.toEqual([
      {
        tag: { id: "tag-1", person_id: "child-missing", qr_token: "abc" },
        child: { id: "child-missing", first_name: "Unknown", last_name: "" },
      },
    ]);
  });

  it("throws when the tags query errors", async () => {
    const client = mockClientFromTables({ checkin_tag: { data: null, error: new Error("boom") } });
    await expect(getMyCheckinTags(client)).rejects.toThrow("boom");
  });
});

describe("getOpenCheckins", () => {
  it("returns an empty array when nobody is checked in", async () => {
    const client = mockClientFromTables({ checkin: ok([]) });
    await expect(getOpenCheckins(client)).resolves.toEqual([]);
  });

  it("joins each open checkin with its matching child", async () => {
    const client = mockClientFromTables({
      checkin: ok([{ id: "c1", person_id: "child-1", checked_in_at: "t" }]),
      person: ok([{ id: "child-1", first_name: "Grace", last_name: "Hopper" }]),
    });

    await expect(getOpenCheckins(client)).resolves.toEqual([
      {
        checkin: { id: "c1", person_id: "child-1", checked_in_at: "t" },
        child: { id: "child-1", first_name: "Grace", last_name: "Hopper" },
      },
    ]);
  });

  it("falls back to an Unknown placeholder when the child row is missing", async () => {
    const client = mockClientFromTables({
      checkin: ok([{ id: "c1", person_id: "child-missing", checked_in_at: "t" }]),
      person: ok([]),
    });

    const result = await getOpenCheckins(client);
    expect(result[0]?.child).toEqual({ id: "child-missing", first_name: "Unknown", last_name: "" });
  });
});

describe("scanCheckin", () => {
  it("maps the RPC row to a CheckinScanResult", async () => {
    const client = {
      rpc: vi.fn(async () => ({
        data: [
          { checkin_id: "c1", person_id: "p1", first_name: "Ada", last_name: "Lovelace", security_code: "1234" },
        ],
        error: null,
      })),
    } as unknown as ShapersClient;

    await expect(scanCheckin(client, "qr-token")).resolves.toEqual({
      checkinId: "c1",
      personId: "p1",
      firstName: "Ada",
      lastName: "Lovelace",
      securityCode: "1234",
    });
  });

  it("throws when the RPC returns no row", async () => {
    const client = { rpc: vi.fn(async () => ({ data: [], error: null })) } as unknown as ShapersClient;
    await expect(scanCheckin(client, "qr-token")).rejects.toThrow("checkin_scan returned no result");
  });

  it("throws when the RPC errors", async () => {
    const client = {
      rpc: vi.fn(async () => ({ data: null, error: new Error("this QR code has expired") })),
    } as unknown as ShapersClient;
    await expect(scanCheckin(client, "qr-token")).rejects.toThrow("this QR code has expired");
  });
});

describe("confirmPickup", () => {
  it("maps the RPC row to a CheckinPickupResult", async () => {
    const client = {
      rpc: vi.fn(async () => ({
        data: [{ checkin_id: "c1", person_id: "p1", checked_out_at: "t" }],
        error: null,
      })),
    } as unknown as ShapersClient;

    await expect(confirmPickup(client, "c1", "qr-token")).resolves.toEqual({
      checkinId: "c1",
      personId: "p1",
      checkedOutAt: "t",
    });
  });

  it("throws when the RPC returns no row", async () => {
    const client = { rpc: vi.fn(async () => ({ data: [], error: null })) } as unknown as ShapersClient;
    await expect(confirmPickup(client, "c1", "qr-token")).rejects.toThrow("checkin_pickup returned no result");
  });
});
