import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { config } from "./config.js";

const signUpSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(12).max(128),
  churchInviteCode: z.string().min(8).max(128),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional(),
});
const loginSchema = z.object({ email: z.string().email().transform((value) => value.trim().toLowerCase()), password: z.string().min(1).max(128) });
const bootstrapSchema = z.object({ token: z.string().min(32), churchName: z.string().trim().min(2).max(200), churchSlug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), email: z.string().email().transform((value) => value.trim().toLowerCase()), password: z.string().min(12).max(128), firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().max(100).optional() });

export async function authenticate(request: FastifyRequest) {
  await request.jwtVerify();
}

export function registerAuthRoutes(app: FastifyInstance) {
  app.post("/internal/bootstrap", async (request, reply) => {
    const parsed = bootstrapSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid bootstrap data", details: parsed.error.flatten().fieldErrors });
    const body = parsed.data;
    if (body.token !== config.BOOTSTRAP_TOKEN) return reply.code(401).send({ error: "Invalid bootstrap token" });
    const { db } = await import("./db.js"); const client = await db.connect(); const { default: bcrypt } = await import("bcryptjs");
    try {
      await client.query("begin");
      const count = await client.query<{ count: string }>("select count(*)::text as count from church");
      if (count.rows[0]?.count !== "0") { await client.query("rollback"); return reply.code(409).send({ error: "Bootstrap is only allowed before the first church exists" }); }
      const church = await client.query<{ id: string; invite_code: string }>("insert into church (name, slug) values ($1, $2) returning id, invite_code", [body.churchName, body.churchSlug]);
      const churchId = church.rows[0]?.id; if (!churchId) throw new Error("Unable to create church");
      const person = await client.query<{ id: string }>("insert into person (church_id, first_name, last_name, email) values ($1, $2, $3, $4) returning id", [churchId, body.firstName, body.lastName ?? "", body.email]);
      const personId = person.rows[0]?.id; if (!personId) throw new Error("Unable to create administrator");
      const passwordHash = await bcrypt.hash(body.password, 12);
      const user = await client.query<{ id: string }>("insert into app_user (person_id, church_id, email, password_hash) values ($1, $2, $3, $4) returning id", [personId, churchId, body.email, passwordHash]);
      await client.query("insert into role_assignment (church_id, person_id, role) values ($1, $2, 'admin')", [churchId, personId]);
      await client.query("commit");
      const userId = user.rows[0]?.id; if (!userId) throw new Error("Unable to create account");
      return reply.code(201).send({ token: app.jwt.sign({ sub: userId, churchId, personId }), inviteCode: church.rows[0]?.invite_code });
    } catch (error) { await client.query("rollback"); throw error; } finally { client.release(); }
  });
  app.post("/auth/signup", async (request, reply) => {
    const parsed = signUpSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid signup data", details: parsed.error.flatten().fieldErrors });
    const body = parsed.data;
    const { default: bcrypt } = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(body.password, 12);
    const client = await (await import("./db.js")).db.connect();
    try {
      await client.query("begin");
      const churchResult = await client.query<{ id: string }>("select id from church where invite_code = $1", [body.churchInviteCode]);
      const churchId = churchResult.rows[0]?.id;
      if (!churchId) { await client.query("rollback"); return reply.code(404).send({ error: "Church invite code was not found" }); }
      const person = await client.query<{ id: string }>("insert into person (church_id, first_name, last_name, email) values ($1, $2, $3, $4) returning id", [churchId, body.firstName, body.lastName ?? "", body.email]);
      const user = await client.query<{ id: string }>("insert into app_user (person_id, church_id, email, password_hash) values ($1, $2, $3, $4) returning id", [person.rows[0]?.id, churchId, body.email, passwordHash]);
      await client.query("commit");
      const personId = person.rows[0]?.id; const userId = user.rows[0]?.id;
      if (!personId || !userId) throw new Error("Unable to create account");
      const token = app.jwt.sign({ sub: userId, churchId, personId });
      return reply.code(201).send({ token });
    } catch (error) { await client.query("rollback"); if ((error as { code?: string }).code === "23505") return reply.code(409).send({ error: "An account with that email already exists" }); throw error; }
    finally { client.release(); }
  });

  app.post("/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid login data" });
    const body = parsed.data;
    const { db } = await import("./db.js");
    const result = await db.query<{ id: string; church_id: string; person_id: string; password_hash: string }>("select id, church_id, person_id, password_hash from app_user where email = $1", [body.email]);
    const user = result.rows[0]; const { default: bcrypt } = await import("bcryptjs");
    if (!user || !(await bcrypt.compare(body.password, user.password_hash))) return reply.code(401).send({ error: "Invalid email or password" });
    return { token: app.jwt.sign({ sub: user.id, churchId: user.church_id, personId: user.person_id }) };
  });

  app.get("/me", { preHandler: authenticate }, async (request) => {
    const { db } = await import("./db.js");
    const [personResult, rolesResult] = await Promise.all([
      db.query("select id, church_id, first_name, last_name, email, phone from person where id = $1 and church_id = $2", [request.user.personId, request.user.churchId]),
      db.query("select id, role, created_at from role_assignment where person_id = $1 and church_id = $2", [request.user.personId, request.user.churchId]),
    ]);
    const person = personResult.rows[0]; if (!person) throw new Error("Account identity is invalid");
    return { person, roleAssignments: rolesResult.rows };
  });
}
