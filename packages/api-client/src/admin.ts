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

// Church integrations (Planning Center OAuth setup)
export interface ChurchIntegration {
  id: string;
  church_id: string;
  provider: "planning_center";
  connected_by: string | null;
  connected_at: string;
  last_synced_at: string | null;
  status: "active" | "token_expired" | "error";
}

// GET /admin/integrations — church_integration_select_admin RLS enforces admin-only
export async function getChurchIntegrations(
  client: ShapersClient,
  churchId: string
): Promise<ChurchIntegration[]> {
  const { data, error } = await client
    .from("church_integration")
    .select("*")
    .eq("church_id", churchId);
  if (error) throw error;
  return data ?? [];
}

// GET /admin/integrations/:provider — check if already connected
export async function getChurchIntegration(
  client: ShapersClient,
  churchId: string,
  provider: string
): Promise<ChurchIntegration | null> {
  const { data, error } = await client
    .from("church_integration")
    .select("*")
    .eq("church_id", churchId)
    .eq("provider", provider)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// POST /admin/integrations — stored encrypted via Supabase vault.
// Requires a backend endpoint that handles the OAuth flow and calls this.
// For now, this is a placeholder for documentation.
// The actual flow should be:
// 1. Admin clicks "Connect Planning Center"
// 2. Backend redirects to PC OAuth endpoint
// 3. User authorizes and is returned with a code
// 4. Backend exchanges code for token (server-side)
// 5. Backend stores encrypted token in church_integration
export async function saveChurchIntegrationToken(
  client: ShapersClient,
  churchId: string,
  provider: string,
  encryptedToken: string
): Promise<ChurchIntegration> {
  const { data, error } = await client
    .from("church_integration")
    .upsert(
      {
        church_id: churchId,
        provider,
        encrypted_token: encryptedToken,
        status: "active",
      },
      { onConflict: "church_id,provider" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}
