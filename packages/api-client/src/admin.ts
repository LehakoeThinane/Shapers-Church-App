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

export type SyncFailureKind = "checkin" | "person_milestone";

export interface SyncFailure {
  id: string;
  kind: SyncFailureKind;
  church_id: string;
  person_id: string;
  sync_status: "failed";
  created_at: string;
  title: string;
  detail: string;
}

export async function getSyncFailures(
  client: ShapersClient,
  churchId: string
): Promise<SyncFailure[]> {
  const [checkinsResult, milestonesResult] = await Promise.all([
    client
      .from("checkin")
      .select("id, church_id, person_id, sync_status, created_at")
      .eq("church_id", churchId)
      .eq("sync_status", "failed")
      .order("created_at", { ascending: false }),
    client
      .from("person_milestone")
      .select("id, church_id, person_id, milestone_type, sync_status, created_at")
      .eq("church_id", churchId)
      .eq("sync_status", "failed")
      .order("created_at", { ascending: false }),
  ]);

  if (checkinsResult.error) throw checkinsResult.error;
  if (milestonesResult.error) throw milestonesResult.error;

  const checkins = (checkinsResult.data ?? []).map((row: any) => ({
    id: row.id,
    kind: "checkin" as const,
    church_id: row.church_id,
    person_id: row.person_id,
    sync_status: "failed" as const,
    created_at: row.created_at,
    title: "Check-in sync failed",
    detail: "The child check-in was not written back to Planning Center.",
  }));

  const milestones = (milestonesResult.data ?? []).map((row: any) => ({
    id: row.id,
    kind: "person_milestone" as const,
    church_id: row.church_id,
    person_id: row.person_id,
    sync_status: "failed" as const,
    created_at: row.created_at,
    title: `Milestone sync failed: ${row.milestone_type ?? "achievement"}`,
    detail: "The milestone update could not be synced to Planning Center.",
  }));

  return [...checkins, ...milestones].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function retrySyncFailure(
  client: ShapersClient,
  kind: SyncFailureKind,
  failureId: string,
  churchId: string
): Promise<void> {
  const table = kind === "checkin" ? "checkin" : "person_milestone";
  const { error } = await client
    .from(table)
    .update({ sync_status: "pending" })
    .eq("id", failureId)
    .eq("church_id", churchId);

  if (error) throw error;
}

// Church integrations (Planning Center OAuth setup)
export type ChurchIntegrationProvider = "planning_center";

export interface ChurchIntegration {
  id: string;
  church_id: string;
  provider: ChurchIntegrationProvider;
  encrypted_token?: string;
  connected_by: string | null;
  connected_at: string;
  last_synced_at: string | null;
  status: "active" | "token_expired" | "error";
}

export interface PlanningCenterOAuthUrlInput {
  clientId: string;
  redirectUri: string;
  state: string;
  scope?: string;
}

export function buildPlanningCenterOAuthUrl({
  clientId,
  redirectUri,
  state,
  scope = "people check-ins",
}: PlanningCenterOAuthUrlInput): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
    scope,
  });

  return `https://api.planningcenteronline.com/oauth/authorize?${params.toString()}`;
}

export interface ConnectPlanningCenterInput {
  churchId: string;
  code: string;
  redirectUri: string;
  connectedByPersonId?: string;
}

export async function connectPlanningCenter(
  client: ShapersClient,
  input: ConnectPlanningCenterInput
): Promise<ChurchIntegration> {
  const { data, error } = await client.functions.invoke("pc-oauth-connect", {
    body: {
      church_id: input.churchId,
      code: input.code,
      redirect_uri: input.redirectUri,
      connected_by_person_id: input.connectedByPersonId ?? null,
    },
  });

  if (error) throw error;
  return data as ChurchIntegration;
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
  provider: ChurchIntegrationProvider
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
  provider: ChurchIntegrationProvider,
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
