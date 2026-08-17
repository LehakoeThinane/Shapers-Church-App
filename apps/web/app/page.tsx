"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@shapers/ui";
import { getCurrentUser } from "@shapers/api-client";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

export default function HomePage() {
  const router = useRouter();

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

    route();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return <LoadingScreen logoSource={logoSource} />;
}
