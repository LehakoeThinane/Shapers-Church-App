"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Text } from "react-native";
import { LoadingScreen, Screen, theme } from "@shapers/ui";
import { getCurrentUser } from "@shapers/api-client";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

export default function HomePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function route() {
      const client = getSupabaseClient();
      const {
        data: { session },
      } = await client.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const me = await getCurrentUser(client);
      if (cancelled) return;

      router.replace(me ? "/dashboard" : "/onboarding/match");
    }

    route().catch((err) => {
      if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (error) {
    return (
      <Screen logoSource={logoSource}>
        <Text style={{ color: theme.color.danger }}>{error}</Text>
      </Screen>
    );
  }

  return <LoadingScreen logoSource={logoSource} />;
}
