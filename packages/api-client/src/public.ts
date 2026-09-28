import type { ShapersClient } from "./client";

export interface PublicSermon {
  id: string;
  title: string;
  speaker_name: string;
  scripture_reference: string | null;
  video_url: string | null;
  audio_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  published_at: string;
}

export interface PublicTestimony { id: string; title: string | null; body: string; created_at: string; }

export async function getPublicSermons(client: ShapersClient, slug: string): Promise<PublicSermon[]> {
  const { data, error } = await client.rpc("get_public_sermons", { p_slug: slug });
  if (error) throw error;
  if (!Array.isArray(data)) throw new Error("Invalid public sermon response.");
  return data as PublicSermon[];
}

export async function getPublicTestimonies(client: ShapersClient, slug: string): Promise<PublicTestimony[]> {
  const { data, error } = await client.rpc("get_public_testimonies", { p_slug: slug });
  if (error) throw error;
  if (!Array.isArray(data)) throw new Error("Invalid public testimony response.");
  return data as PublicTestimony[];
}
