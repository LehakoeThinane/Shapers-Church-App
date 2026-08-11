import type { Database, Role, RoleScopeType } from "./database";

export type Church = Database["public"]["Tables"]["church"]["Row"];
export type Household = Database["public"]["Tables"]["household"]["Row"];
export type Person = Database["public"]["Tables"]["person"]["Row"];
export type AppUser = Database["public"]["Tables"]["app_user"]["Row"];
export type RoleAssignment = Database["public"]["Tables"]["role_assignment"]["Row"];
export type ChurchIntegration = Database["public"]["Tables"]["church_integration"]["Row"];
export type Checkin = Database["public"]["Tables"]["checkin"]["Row"];
export type CheckinTag = Database["public"]["Tables"]["checkin_tag"]["Row"];

export type { Role, RoleScopeType };

// GET /me
export interface CurrentUser {
  person: Person;
  household: Household | null;
  roleAssignments: RoleAssignment[];
}

// GET /checkin-tags/me — this week's QR tokens for my children, with
// enough person info to render a labeled card per child.
export interface MyCheckinTag {
  tag: CheckinTag;
  child: Pick<Person, "id" | "first_name" | "last_name">;
}

// Result of POST /checkin/scan
export interface CheckinScanResult {
  checkinId: string;
  personId: string;
  firstName: string;
  lastName: string;
  securityCode: string;
}

// Result of POST /checkin/:id/pickup
export interface CheckinPickupResult {
  checkinId: string;
  personId: string;
  checkedOutAt: string;
}

// A currently-checked-in child, for the staff pickup list.
export interface OpenCheckin {
  checkin: Checkin;
  child: Pick<Person, "id" | "first_name" | "last_name">;
}
