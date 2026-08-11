import type { CurrentUser } from "@shapers/types";
import type { ShapersClient } from "./client";

// GET /me — current person + household + role assignments.
export async function getCurrentUser(client: ShapersClient): Promise<CurrentUser | null> {
  const {
    data: { user: authUser },
  } = await client.auth.getUser();
  if (!authUser) return null;

  const { data: appUser, error: appUserError } = await client
    .from("app_user")
    .select("person_id")
    .eq("id", authUser.id)
    .maybeSingle();
  if (appUserError) throw appUserError;
  if (!appUser) return null; // signed up but hasn't completed onboarding/match-person yet

  const { data: person, error: personError } = await client
    .from("person")
    .select("*")
    .eq("id", appUser.person_id)
    .single();
  if (personError) throw personError;

  const [{ data: household, error: householdError }, { data: roleAssignments, error: roleError }] =
    await Promise.all([
      person.household_id
        ? client.from("household").select("*").eq("id", person.household_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      client.from("role_assignment").select("*").eq("person_id", person.id),
    ]);
  if (householdError) throw householdError;
  if (roleError) throw roleError;

  return {
    person,
    household: household ?? null,
    roleAssignments: roleAssignments ?? [],
  };
}
