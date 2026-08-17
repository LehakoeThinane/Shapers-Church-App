import type { Church } from "@shapers/types";
import type { ShapersClient } from "./client";

// GET /admin/integrations-ish — the caller's own church row, including
// invite_code. Regular RLS (church_select_own) already allows any
// member to read their own church, so this needs no RPC.
export async function getChurch(client: ShapersClient, churchId: string): Promise<Church | null> {
  const { data, error } = await client.from("church").select("*").eq("id", churchId).maybeSingle();
  if (error) throw error;
  return data;
}

// POST /onboarding/join-church
// Looks up a church by invite code via the find_church_by_invite_code RPC
// (see supabase/migrations/20260811120008_onboarding_functions.sql) since
// the caller isn't a member of any church yet and RLS wouldn't otherwise
// let them see the church row.
export async function findChurchByInviteCode(client: ShapersClient, inviteCode: string) {
  const { data, error } = await client.rpc("find_church_by_invite_code", {
    p_invite_code: inviteCode,
  });
  if (error) throw error;
  return data?.[0] ?? null;
}

// Single-church deployments don't need an invite code just to sign up —
// this resolves the one church that exists, via the same SECURITY
// DEFINER pattern as findChurchByInviteCode.
export async function getDefaultChurch(client: ShapersClient) {
  const { data, error } = await client.rpc("get_default_church");
  if (error) throw error;
  return data?.[0] ?? null;
}

export interface MatchPersonInput {
  churchId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

// POST /onboarding/match-person
// Matches (or creates) a person record and links it to the signed-in auth
// user. Returns the linked person_id.
export async function matchPerson(client: ShapersClient, input: MatchPersonInput) {
  const { data, error } = await client.rpc("onboard_match_person", {
    p_church_id: input.churchId,
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    p_phone: input.phone ?? null,
    p_email: input.email ?? null,
  });
  if (error) throw error;
  return data as string;
}

// Auto-completes the join-church step after a Google sign-in, using
// whatever name Google gave us (Supabase populates user_metadata from
// the OAuth identity) instead of asking the person to retype it on a
// separate screen. Deliberately never gives up on finding *some* name to
// use — a single-word Google display name, or even no name data at all,
// still completes silently (falling back to the email's local part)
// rather than dropping the person into the manual form, since that form
// is meant to be an exceptional fallback, not something Google sign-in
// regularly hits. Returns null only if there's no session at all, or no
// church exists yet to join.
export async function completeGoogleOnboarding(client: ShapersClient): Promise<string | null> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;

  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const fullName = (meta.full_name ?? meta.name ?? "").trim();
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const emailLocalPart = user.email?.split("@")[0];
  const firstName = meta.given_name || nameParts[0] || emailLocalPart || "Member";
  const lastName = meta.family_name || nameParts.slice(1).join(" ");

  const church = await getDefaultChurch(client);
  if (!church) return null;

  return matchPerson(client, {
    churchId: church.id,
    firstName,
    lastName,
    email: user.email ?? undefined,
  });
}

// POST /become-member — redeems a (now membership-only) invite code,
// granting the 'member' role to an already-onboarded caller. Unlike
// matchPerson, this never creates an app_user row — it only adds a role
// to one that already exists.
export async function becomeMember(client: ShapersClient, inviteCode: string) {
  const { error } = await client.rpc("onboard_become_member", { p_invite_code: inviteCode });
  if (error) throw error;
}
