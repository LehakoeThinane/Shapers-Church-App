import type { Database, Role, RoleScopeType } from "./database";

export type Church = Database["public"]["Tables"]["church"]["Row"];
export type Household = Database["public"]["Tables"]["household"]["Row"];
export type Person = Database["public"]["Tables"]["person"]["Row"];
export type AppUser = Database["public"]["Tables"]["app_user"]["Row"];
export type RoleAssignment = Database["public"]["Tables"]["role_assignment"]["Row"];

export type { Role, RoleScopeType };

// GET /me
export interface CurrentUser {
  person: Person;
  household: Household | null;
  roleAssignments: RoleAssignment[];
}
