import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createShapersClient, type ShapersClient } from "@shapers/api-client";

// Suppress WebCrypto warnings from Supabase — the app works fine with plain
// PKCE mode in React Native. This keeps the console clean.
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (args[0]?.includes?.("WebCrypto API") || args[0]?.includes?.("Code challenge method")) {
    return; // Silently ignore WebCrypto warnings
  }
  originalWarn(...args);
};

let client: ShapersClient | undefined;

export function getSupabaseClient(): ShapersClient {
  if (!client) {
    client = createShapersClient({
      url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
      storage: AsyncStorage,
    });
  }
  return client;
}
