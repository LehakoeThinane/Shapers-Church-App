// Weekly QR token generation — supabase/functions/qr-token-generate
//
// Thin wrapper around the generate_weekly_checkin_tags() Postgres
// function (see supabase/migrations/20260811130004_checkin_functions.sql,
// tested directly against real Postgres — that's the part doing real
// work). This function exists so the job can be triggered on a schedule
// via Supabase's Scheduled Functions (Dashboard -> Edge Functions ->
// this function -> Cron, e.g. "0 0 * * 1" for every Monday) rather than
// requiring pg_cron to be enabled on the database itself.
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase.rpc("generate_weekly_checkin_tags");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ generated: data }), { status: 200 });
});
