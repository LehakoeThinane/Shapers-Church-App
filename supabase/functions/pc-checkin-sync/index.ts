// Planning Center check-in write-back — supabase/functions/pc-checkin-sync
//
// Trigger: a Supabase Database Webhook on `checkin` (event: INSERT),
// configured once via the Supabase Dashboard once this function is
// deployed (Database -> Webhooks -> new webhook -> table `checkin`,
// insert, HTTP request to this function's URL). Not wired up via a SQL
// trigger + pg_net in the migrations, because that would need to
// hardcode this function's deployed URL, which doesn't exist until a
// real project deploys it — see docs/shapers-developer-handoff.md
// Section 2 on why each integration gets its own folder here.
//
// This intentionally runs *after* checkin_scan() returns to the caller
// (see supabase/migrations/20260811130004_checkin_functions.sql), not
// inline inside that RPC — a slow or down Planning Center API should
// never block the drop-off line.
//
// NOT independently testable in this environment: there's no Planning
// Center developer app connected yet (confirmed out of scope for this
// pass), so the actual fetch() call below is written against Planning
// Center's public Check-Ins API docs but has never been exercised
// against a real PC account. Treat it as a structural starting point,
// not verified working code — the sync_status bookkeeping (pending ->
// synced/failed) around it *is* the tested, load-bearing part.

import { createClient } from "npm:@supabase/supabase-js@2";

interface CheckinWebhookPayload {
  type: "INSERT";
  table: "checkin";
  record: {
    id: string;
    church_id: string;
    person_id: string;
    checked_in_at: string;
    security_code: string | null;
  };
}

Deno.serve(async (req) => {
  const payload = (await req.json()) as CheckinWebhookPayload;
  const checkin = payload.record;

  // service_role: this function runs as a trusted backend job, not on
  // behalf of any particular signed-in user, so it needs to bypass RLS
  // to read church_integration and update the checkin row.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: integration } = await supabase
    .from("church_integration")
    .select("encrypted_token, status")
    .eq("church_id", checkin.church_id)
    .eq("provider", "planning_center")
    .maybeSingle();

  if (!integration || integration.status !== "active") {
    // Expected, not exceptional: most churches won't have Planning
    // Center connected yet. Staff see this on the failed-sync dashboard
    // (Phase 7) rather than the app silently pretending it worked.
    await supabase
      .from("checkin")
      .update({ sync_status: "failed" })
      .eq("id", checkin.id);
    return new Response(JSON.stringify({ synced: false, reason: "no_active_integration" }), {
      status: 200,
    });
  }

  try {
    const { data: person } = await supabase
      .from("person")
      .select("pc_person_id")
      .eq("id", checkin.person_id)
      .single();

    if (!person?.pc_person_id) {
      throw new Error("person has no linked Planning Center record (pc_person_id is null)");
    }

    // Planning Center Check-Ins API: POST /check-ins/v2/events/{event_id}/check_ins
    // The event_id a walk-in check-in belongs to isn't modeled anywhere
    // yet (no `pc_event_id` on church or a per-service-time concept in
    // the schema) — this is the actual integration gap blocking a real
    // PC write-back, not just missing credentials. Left as the next
    // concrete step for whoever wires up a real PC connection.
    const token = decryptToken(integration.encrypted_token);
    const response = await fetch(
      `https://api.planningcenteronline.com/check-ins/v2/persons/${person.pc_person_id}/check_ins`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            type: "CheckIn",
            attributes: {
              checked_in_at: checkin.checked_in_at,
              security_code: checkin.security_code,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Planning Center API error: ${response.status} ${await response.text()}`);
    }

    const pcCheckin = await response.json();

    await supabase
      .from("checkin")
      .update({
        sync_status: "synced",
        pc_checkin_id: pcCheckin.data?.id ?? null,
      })
      .eq("id", checkin.id);

    return new Response(JSON.stringify({ synced: true }), { status: 200 });
  } catch (error) {
    await supabase.from("checkin").update({ sync_status: "failed" }).eq("id", checkin.id);
    return new Response(
      JSON.stringify({ synced: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 200 } // 200: the webhook delivery itself succeeded, only the sync failed
    );
  }
});

// Placeholder — church_integration.encrypted_token needs real encryption
// at rest (e.g. via Supabase Vault) before this is production-ready.
// Not implemented: no real Planning Center token exists yet to decide
// the encryption scheme against.
function decryptToken(encryptedToken: string): string {
  return encryptedToken;
}
