import { describe, expect, it, vi } from "vitest";
import {
  assignRole,
  buildPlanningCenterOAuthUrl,
  connectPlanningCenter,
  getChurchPeople,
  getRoleAssignments,
  getSyncFailures,
  retrySyncFailure,
  revokeRole,
} from "./admin";
import { mockClientFromTables, ok } from "./test-utils";

describe("getChurchPeople", () => {
  it("returns the people list", async () => {
    const people = [{ id: "p1", first_name: "Ada", last_name: "Lovelace" }];
    const client = mockClientFromTables({ person: ok(people) });
    await expect(getChurchPeople(client)).resolves.toEqual(people);
  });

  it("returns an empty array when there are no people", async () => {
    const client = mockClientFromTables({ person: ok(null) });
    await expect(getChurchPeople(client)).resolves.toEqual([]);
  });
});

describe("getRoleAssignments", () => {
  it("returns the role assignment list", async () => {
    const roles = [{ id: "ra1", person_id: "p1", role: "admin" }];
    const client = mockClientFromTables({ role_assignment: ok(roles) });
    await expect(getRoleAssignments(client)).resolves.toEqual(roles);
  });
});

describe("assignRole", () => {
  it("inserts a role assignment with the given scope", async () => {
    const created = { id: "ra1", church_id: "c1", person_id: "p1", role: "cell_leader" };
    const client = mockClientFromTables({ role_assignment: ok(created) });

    await expect(
      assignRole(client, {
        churchId: "c1",
        personId: "p1",
        role: "cell_leader",
        scopeType: "cell",
        scopeId: "group-1",
      })
    ).resolves.toEqual(created);
  });

  it("throws on a duplicate assignment", async () => {
    const client = mockClientFromTables({
      role_assignment: { data: null, error: new Error("duplicate key value violates unique constraint") },
    });
    await expect(
      assignRole(client, { churchId: "c1", personId: "p1", role: "admin" })
    ).rejects.toThrow("duplicate key");
  });
});

describe("revokeRole", () => {
  it("deletes the role assignment", async () => {
    const client = mockClientFromTables({ role_assignment: ok(null) });
    await expect(revokeRole(client, "ra1")).resolves.toBeUndefined();
  });
});

describe("getSyncFailures", () => {
  it("returns failed checkin and milestone sync rows for the church", async () => {
    const client = mockClientFromTables({
      checkin: ok([
        { id: "c1", church_id: "church-1", person_id: "p1", sync_status: "failed", created_at: "2026-08-29T00:00:00Z" },
      ]),
      person_milestone: ok([
        {
          id: "m1",
          church_id: "church-1",
          person_id: "p2",
          milestone_type: "baptism",
          sync_status: "failed",
          created_at: "2026-08-28T00:00:00Z",
        },
      ]),
    });

    await expect(getSyncFailures(client, "church-1")).resolves.toEqual([
      {
        id: "c1",
        kind: "checkin",
        church_id: "church-1",
        person_id: "p1",
        sync_status: "failed",
        created_at: "2026-08-29T00:00:00Z",
        title: "Check-in sync failed",
        detail: "The child check-in was not written back to Planning Center.",
      },
      {
        id: "m1",
        kind: "person_milestone",
        church_id: "church-1",
        person_id: "p2",
        sync_status: "failed",
        created_at: "2026-08-28T00:00:00Z",
        title: "Milestone sync failed: baptism",
        detail: "The milestone update could not be synced to Planning Center.",
      },
    ]);
  });
});

describe("retrySyncFailure", () => {
  it("resets failed sync rows back to pending", async () => {
    const client = mockClientFromTables({
      checkin: ok(null),
    });

    await expect(retrySyncFailure(client, "checkin", "c1", "church-1")).resolves.toBeUndefined();
  });
});

describe("buildPlanningCenterOAuthUrl", () => {
  it("builds a Planning Center OAuth URL with the required params", () => {
    const url = buildPlanningCenterOAuthUrl({
      clientId: "pc-client-id",
      redirectUri: "https://app.example.com/admin/integrations/callback",
      state: "church-123",
    });

    expect(url).toContain("https://api.planningcenteronline.com/oauth/authorize");
    expect(url).toContain("client_id=pc-client-id");
    expect(url).toContain("redirect_uri=https%3A%2F%2Fapp.example.com%2Fadmin%2Fintegrations%2Fcallback");
    expect(url).toContain("state=church-123");
    expect(url).toContain("response_type=code");
  });
});

describe("connectPlanningCenter", () => {
  it("invokes the edge function and returns the stored integration", async () => {
    const integration = {
      id: "i1",
      church_id: "c1",
      provider: "planning_center",
      connected_by: "p1",
      connected_at: "2026-08-29T00:00:00.000Z",
      last_synced_at: null,
      status: "active",
    };

    const client = {
      functions: {
        invoke: vi.fn(async () => ({ data: integration, error: null })),
      },
    } as unknown as any;

    await expect(
      connectPlanningCenter(client, {
        churchId: "c1",
        code: "auth-code-123",
        redirectUri: "https://app.example.com/admin/integrations/callback",
        connectedByPersonId: "p1",
      })
    ).resolves.toEqual(integration);

    expect(client.functions.invoke).toHaveBeenCalledWith("pc-oauth-connect", {
      body: {
        church_id: "c1",
        code: "auth-code-123",
        redirect_uri: "https://app.example.com/admin/integrations/callback",
        connected_by_person_id: "p1",
      },
    });
  });

  it("throws when the edge function reports an error", async () => {
    const client = {
      functions: {
        invoke: vi.fn(async () => ({ data: null, error: new Error("OAuth exchange failed") })),
      },
    } as unknown as any;

    await expect(
      connectPlanningCenter(client, {
        churchId: "c1",
        code: "bad-code",
        redirectUri: "https://app.example.com/admin/integrations/callback",
      })
    ).rejects.toThrow("OAuth exchange failed");
  });
});
