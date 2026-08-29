import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@shapers/types";

export type ShapersClient = SupabaseClient<Database>;

export interface CreateShapersClientOptions {
  url: string;
  anonKey: string;
  // Expo needs AsyncStorage injected; Next.js uses the browser default.
  storage?: {
    getItem: (key: string) => Promise<string | null> | string | null;
    setItem: (key: string, value: string) => Promise<void> | void;
    removeItem: (key: string) => Promise<void> | void;
  };
}

export function createShapersClient(options: CreateShapersClientOptions): ShapersClient {
  const { url, anonKey, storage } = options;

  if (!url || !anonKey) {
    throw new Error(
      "createShapersClient: both url and anonKey are required (missing Supabase env vars?)"
    );
  }

  return createSupabaseClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: !storage, // web only; RN has no URL to parse
      storage,
      // PKCE instead of the implicit grant: the OAuth redirect carries a
      // single-use `code` (exchanged for tokens via a stored code_verifier)
      // rather than access/refresh tokens sitting directly in the URL,
      // where a webview or browser history could otherwise retain them.
      // Web needs no other change — detectSessionInUrl already auto-
      // exchanges a `?code=` the same way it auto-parsed `#access_token=`
      // before; mobile's googleAuth.ts does the exchange explicitly since
      // RN has no URL for the client to detect on its own.
      flowType: "pkce",
    },
  });
}
