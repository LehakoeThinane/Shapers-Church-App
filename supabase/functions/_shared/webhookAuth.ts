// Shared-secret verification for the service_role edge functions
// (pc-checkin-sync, pc-milestone-sync, qr-token-generate). These bypass
// RLS entirely, so they can't rely on Supabase's default JWT check —
// verify_jwt only requires *a* valid Supabase JWT, and the public anon
// key shipped in every client bundle satisfies that trivially. Each of
// these functions is set to verify_jwt = false in supabase/config.toml
// and instead requires a static bearer secret, configured two places:
//   - as an Edge Function secret: `supabase secrets set <ENV_VAR>=<value>`
//   - as a custom "Authorization: Bearer <value>" header on whatever
//     triggers the function — a Database Webhook (Dashboard -> Database
//     -> Webhooks) for pc-checkin-sync/pc-milestone-sync, or the cron
//     job's HTTP request (Dashboard -> Edge Functions -> Cron) for
//     qr-token-generate.
export function requireSharedSecret(req: Request, envVar: string): Response | null {
  const expected = Deno.env.get(envVar);
  if (!expected) {
    return new Response(JSON.stringify({ error: `${envVar} is not configured` }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const provided = req.headers.get("authorization");
  if (provided !== `Bearer ${expected}`) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  return null;
}
