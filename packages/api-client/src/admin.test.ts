import { describe, expect, it } from "vitest";
import { assignRole, getChurchPeople, getRoleAssignments, revokeRole } from "./admin";
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
