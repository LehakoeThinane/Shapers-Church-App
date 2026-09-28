import type { ChurchPublicContent } from "@shapers/types";
import type { ShapersClient } from "./client";

export type PublicContentKey = "mission_statement" | "what_to_expect" | "beliefs";
export type PublicContentValues = Record<PublicContentKey, string>;

export async function getChurchPublicContent(client: ShapersClient, churchId: string): Promise<PublicContentValues> {
  const { data, error } = await client.from("church_public_content").select("key, body").eq("church_id", churchId);
  if (error) throw error;
  const entries = new Map((data ?? []).map((row) => [row.key, row.body ?? ""]));
  return { mission_statement: entries.get("mission_statement") ?? "", what_to_expect: entries.get("what_to_expect") ?? "", beliefs: entries.get("beliefs") ?? "" };
}

export async function saveChurchPublicContent(client: ShapersClient, churchId: string, values: PublicContentValues): Promise<ChurchPublicContent[]> {
  const rows = (Object.entries(values) as [PublicContentKey, string][]).map(([key, body]) => ({ church_id: churchId, key, body: body.trim() || null, updated_at: new Date().toISOString() }));
  const { data, error } = await client.from("church_public_content").upsert(rows, { onConflict: "church_id,key" }).select();
  if (error) throw error;
  return data ?? [];
}

export async function saveChurchSlug(client: ShapersClient, churchId: string, slug: string): Promise<void> {
  const normalized = slug.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) throw new Error("Use lowercase letters, numbers, and single hyphens only.");
  const { error } = await client.from("church").update({ slug: normalized }).eq("id", churchId);
  if (error) throw error;
}
