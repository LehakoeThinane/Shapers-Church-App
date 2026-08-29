// Planning Center milestone write-back — supabase/functions/pc-milestone-sync
//
// Trigger: a Supabase Database Webhook on `person_milestone` (event:
// INSERT), configured via the Dashboard once this function is deployed
// — same setup as pc-checkin-sync, and the same reason it's not a SQL
// trigger + pg_net: this function's deployed URL doesn't exist until a
// real project deploys it.
//
// Architecture doc Section 5 also calls for this to eventually become
// two-way (a status change made directly in PC should flow back into
// the app rather than the app's display going stale) — that's a
// separate periodic-pull job, not implemented here; this function only
// covers the write-back direction.
//
// NOT independently testable in this environment, same caveat as
// pc-checkin-sync: no Planning Center developer app is connected yet.
// Beyond that, this one has a real, unresolved design question that
// credentials alone won't fix — Planning Center's People module has no
// built-in "milestone" concept. Real options are a custom field or a
// List membership per milestone_type, and which one is right depends on
// how the connected church's PC instance is actually configured, not
// something to guess at here. `applyMilestoneToPlanningCenter` below is
// a placeholder for that decision.

import { createClient } from "npm:@supabase/supabase-js@2";
import { requireSharedSecret } from "../_shared/webhookAuth.ts";
import { decryptToken } from "../_shared/tokenCrypto.ts";

interface MilestoneWebhookPayload {
  type: "INSERT";
  table: "person_milestone";
  record: {
    id: string;
    church_id: string;
    person_id: string;
    milestone_type: string;
    achieved_at: string;
  };
}

Deno.serve(async (req) => {
  const authError = requireSharedSecret(req, "PC_MILESTONE_SYNC_WEBHOOK_SECRET");
  if (authError) return authError;

  const payload = (await req.json()) as MilestoneWebhookPayload;
  const milestone = payload.record;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: integration } = await supabase
    .from("church_integration")
    .select("encrypted_token, status")
    .eq("church_id", milestone.church_id)
    .eq("provider", "planning_center")
    .maybeSingle();

  if (!integration || integration.status !== "active") {
    await supabase
      .from("person_milestone")
      .update({ sync_status: "failed" })
      .eq("id", milestone.id);
    return new Response(JSON.stringify({ synced: false, reason: "no_active_integration" }), {
      status: 200,
    });
  }

  try {
    const { data: person } = await supabase
      .from("person")
      .select("pc_person_id")
      .eq("id", milestone.person_id)
      .single();

    if (!person?.pc_person_id) {
      throw new Error("person has no linked Planning Center record (pc_person_id is null)");
    }

    const token = await decryptToken(integration.encrypted_token);
    await applyMilestoneToPlanningCenter(token, person.pc_person_id, milestone.milestone_type);

    await supabase
      .from("person_milestone")
      .update({ sync_status: "synced", pc_synced_at: new Date().toISOString() })
      .eq("id", milestone.id);

    return new Response(JSON.stringify({ synced: true }), { status: 200 });
  } catch (error) {
    await supabase
      .from("person_milestone")
      .update({ sync_status: "failed" })
      .eq("id", milestone.id);
    return new Response(
      JSON.stringify({ synced: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 200 }
    );
  }
});

// Placeholder — see the header note. Needs a real decision (custom
// field vs. List membership) against an actual connected PC account
// before this does anything real.
async function applyMilestoneToPlanningCenter(
  _token: string,
  _pcPersonId: string,
  _milestoneType: string
): Promise<void> {
  throw new Error("applyMilestoneToPlanningCenter is not implemented yet");
}
