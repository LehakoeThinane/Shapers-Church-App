import type { Testimony } from "@shapers/types";
import type { ShapersClient } from "./client";

export async function getTestimonies(client: ShapersClient): Promise<Testimony[]> {
  const { data, error } = await client.from("testimony").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function submitTestimony(client: ShapersClient, input: Pick<Testimony, "church_id" | "submitted_by" | "title" | "body" | "media_url" | "is_anonymous">): Promise<Testimony> {
  const { data, error } = await client.from("testimony").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function approveTestimony(client: ShapersClient, testimonyId: string): Promise<void> {
  const { error } = await client.rpc("approve_testimony", { p_testimony_id: testimonyId });
  if (error) throw error;
}
