import { describe, expect, it, vi } from "vitest";
import type { ShapersClient } from "./client";
import { getCurrentUser } from "./me";
import { mockClientFromTables, ok } from "./test-utils";

function withAuthUser(client: ShapersClient, user: { id: string } | null): ShapersClient {
  return {
    ...client,
    auth: { getUser: vi.fn(async () => ({ data: { user } })) },
  } as unknown as ShapersClient;
}

describe("getCurrentUser", () => {
  it("returns null when there is no signed-in user", async () => {
    const client = withAuthUser(mockClientFromTables({}), null);
    await expect(getCurrentUser(client)).resolves.toBeNull();
  });

  it("returns null when the login has no app_user row yet (onboarding incomplete)", async () => {
    const client = withAuthUser(mockClientFromTables({ app_user: ok(null) }), { id: "auth-1" });
    await expect(getCurrentUser(client)).resolves.toBeNull();
  });

  it("assembles person + household + role assignments", async () => {
    const person = { id: "person-1", household_id: "household-1", first_name: "Ada", last_name: "Lovelace" };
    const household = { id: "household-1", name: "Lovelace Household" };
    const roleAssignments = [{ id: "ra-1", person_id: "person-1", role: "member" }];
    const client = withAuthUser(
      mockClientFromTables({
        app_user: ok({ person_id: "person-1" }),
        person: ok(person),
        household: ok(household),
        role_assignment: ok(roleAssignments),
      }),
      { id: "auth-1" }
    );

    await expect(getCurrentUser(client)).resolves.toEqual({ person, household, roleAssignments });
  });

  it("skips the household fetch entirely when the person has none", async () => {
    const person = { id: "person-1", household_id: null, first_name: "Ada", last_name: "Lovelace" };
    const client = withAuthUser(
      mockClientFromTables({
        app_user: ok({ person_id: "person-1" }),
        person: ok(person),
        role_assignment: ok([]),
        // Deliberately no "household" entry: if getCurrentUser queried it
        // anyway despite household_id being null, mockClientFromTables
        // would throw "unexpected table: household" and fail this test.
      }),
      { id: "auth-1" }
    );

    await expect(getCurrentUser(client)).resolves.toEqual({ person, household: null, roleAssignments: [] });
  });
});
