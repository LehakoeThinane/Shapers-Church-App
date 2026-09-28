import type { FastifyInstance } from "fastify";
import { db } from "./db.js";

export function registerPublicRoutes(app: FastifyInstance) {
  app.get("/public/churches/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const churchResult = await db.query<{ id: string; name: string; slug: string }>("select id, name, slug from church where slug = lower($1)", [slug]);
    const church = churchResult.rows[0];
    if (!church) return reply.code(404).send({ error: "Church not found" });
    const [contentResult, eventResult] = await Promise.all([
      db.query<{ key: string; body: string | null }>("select key, body from church_public_content where church_id = $1", [church.id]),
      db.query<{ title: string; starts_at: string; location: string | null }>("select title, starts_at, location from event where church_id = $1 and starts_at >= now() order by starts_at asc limit 1", [church.id]),
    ]);
    return { name: church.name, slug: church.slug, content: Object.fromEntries(contentResult.rows.map((row) => [row.key, row.body])), next_event: eventResult.rows[0] ?? null };
  });

  app.get("/public/churches/:slug/sermons", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const result = await db.query("select s.id, s.title, s.speaker_name, s.scripture_reference, s.video_url, s.audio_url, s.thumbnail_url, s.duration_seconds, s.published_at from sermon s join church c on c.id = s.church_id where c.slug = lower($1) and s.published_at is not null and s.published_at <= now() order by s.published_at desc", [slug]);
    return reply.send(result.rows);
  });

  app.get("/public/churches/:slug/testimonies", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const result = await db.query("select t.id, t.title, t.body, t.created_at from testimony t join church c on c.id = t.church_id where c.slug = lower($1) and t.is_approved = true order by t.created_at desc", [slug]);
    return reply.send(result.rows);
  });
}
