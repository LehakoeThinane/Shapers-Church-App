import type { ShapersClient } from "./client";

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
