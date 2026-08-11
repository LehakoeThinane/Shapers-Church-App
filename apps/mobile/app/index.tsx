import { useEffect } from "react";
import { useRouter } from "expo-router";
import { getCurrentUser } from "@shapers/api-client";
import { getSupabaseClient } from "@/lib/supabase";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function route() {
      const client = getSupabaseClient();
      const {
        data: { session },
      } = await client.auth.getSession();

      if (!session) {
        router.replace("/(auth)/login");
        return;
      }

      const me = await getCurrentUser(client);
      if (cancelled) return;
      router.replace(me ? "/dashboard" : "/onboarding/join");
    }

    route();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
