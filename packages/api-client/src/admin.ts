import type { Person, Role, RoleAssignment, RoleScopeType } from "@shapers/types";
import type { ShapersClient } from "./client";

// GET /admin/people — every person in the church, for admin pickers (role
// assignment, group membership). person_select_admin RLS already scopes
// this to admins only.
export async function getChurchPeople(client: ShapersClient): Promise<Person[]> {
  const { data, error } = await client.from("person").select("*").order("first_name");
  if (error) throw error;
  return data ?? [];
}

// GET /admin/roles — every role assignment in the church.
// role_assignment_select_admin RLS already scopes this to admins only.
export async function getRoleAssignments(client: ShapersClient): Promise<RoleAssignment[]> {
  const { data, error } = await client
    .from("role_assignment")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface AssignRoleInput {
  churchId: string;
  personId: string;
  role: Role;
  scopeType?: RoleScopeType;
  scopeId?: string;
}

// POST /admin/roles — role_assignment_admin_write RLS enforces admin-only.
export async function assignRole(client: ShapersClient, input: AssignRoleInput): Promise<RoleAssignment> {
  const { data, error } = await client
    .from("role_assignment")
    .insert({
      church_id: input.churchId,
      person_id: input.personId,
      role: input.role,
      scope_type: input.scopeType ?? null,
      scope_id: input.scopeId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// DELETE /admin/roles/:id — role_assignment_admin_write RLS enforces admin-only.
export async function revokeRole(client: ShapersClient, roleAssignmentId: string): Promise<void> {
  const { error } = await client.from("role_assignment").delete().eq("id", roleAssignmentId);
  if (error) throw error;
}
