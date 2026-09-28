import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { db } from "./db.js";
import { authenticate } from "./auth.js";

const contentSchema = z.object({ missionStatement: z.string().max(2000), whatToExpect: z.string().max(5000), beliefs: z.string().max(5000) });
const sermonSchema = z.object({ title: z.string().trim().min(1).max(300), speakerName: z.string().trim().min(1).max(200), scriptureReference: z.string().max(300).optional(), videoUrl: z.string().url().optional(), audioUrl: z.string().url().optional(), publishNow: z.boolean() });

export async function requireAdmin(request: FastifyRequest) {
  const role = await db.query("select 1 from role_assignment where church_id = $1 and person_id = $2 and role = 'admin'", [request.user.churchId, request.user.personId]);
  if (role.rowCount !== 1) throw Object.assign(new Error("Administrator role required"), { statusCode: 403 });
}

export function registerAdminRoutes(app: FastifyInstance) {
  app.get("/admin/public-content", { preHandler: [authenticate, requireAdmin] }, async (request) => {
    const result = await db.query<{ key: string; body: string | null }>("select key, body from church_public_content where church_id = $1", [request.user.churchId]);
    const values = new Map(result.rows.map((row) => [row.key, row.body ?? ""]));
    return { missionStatement: values.get("mission_statement") ?? "", whatToExpect: values.get("what_to_expect") ?? "", beliefs: values.get("beliefs") ?? "" };
  });

  app.put("/admin/public-content", { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const parsed = contentSchema.safeParse(request.body); if (!parsed.success) return reply.code(400).send({ error: "Invalid public content", details: parsed.error.flatten().fieldErrors });
    const values: [string, string][] = [["mission_statement", parsed.data.missionStatement], ["what_to_expect", parsed.data.whatToExpect], ["beliefs", parsed.data.beliefs]];
    const client = await db.connect();
    try { await client.query("begin"); for (const [key, body] of values) await client.query("insert into church_public_content (church_id, key, body) values ($1, $2, $3) on conflict (church_id, key) do update set body = excluded.body, updated_at = now()", [request.user.churchId, key, body.trim() || null]); await client.query("commit"); return reply.code(204).send(); }
    catch (error) { await client.query("rollback"); throw error; } finally { client.release(); }
  });

  app.post("/admin/sermons", { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const parsed = sermonSchema.safeParse(request.body); if (!parsed.success || (!parsed.data.videoUrl && !parsed.data.audioUrl)) return reply.code(400).send({ error: "A title, speaker, and video or audio URL are required" });
    const item = parsed.data;
    const result = await db.query("insert into sermon (church_id, title, speaker_name, scripture_reference, video_url, audio_url, published_at) values ($1, $2, $3, $4, $5, $6, $7) returning id, title, speaker_name, published_at", [request.user.churchId, item.title, item.speakerName, item.scriptureReference?.trim() || null, item.videoUrl?.trim() || null, item.audioUrl?.trim() || null, item.publishNow ? new Date().toISOString() : null]);
    return reply.code(201).send(result.rows[0]);
  });
}
