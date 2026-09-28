import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");
await db.query("create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())");
const applied = new Set((await db.query<{ name: string }>("select name from schema_migrations")).rows.map((row) => row.name));
for (const name of (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort()) {
  if (applied.has(name)) continue;
  const client = await db.connect();
  try { await client.query("begin"); await client.query(await readFile(join(migrationsDir, name), "utf8")); await client.query("insert into schema_migrations (name) values ($1)", [name]); await client.query("commit"); console.log(`Applied ${name}`); }
  catch (error) { await client.query("rollback"); throw error; } finally { client.release(); }
}
await db.end();
