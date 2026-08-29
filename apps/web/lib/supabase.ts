"use client";

import { createShapersClient, type ShapersClient } from "@shapers/api-client";

let client: ShapersClient | undefined;

// Singleton browser client — Next.js can re-evaluate this module across
// fast-refresh reloads, so guard against creating a new client (and losing
// the persisted session) every time.
export function getSupabaseClient(): ShapersClient {
  if (!client) {
    client = createShapersClient({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    });
  }
  return client;
}
