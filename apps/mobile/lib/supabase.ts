import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createShapersClient, type ShapersClient } from "@shapers/api-client";

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
