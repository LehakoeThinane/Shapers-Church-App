"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@shapers/api-client";
import { getSupabaseClient } from "@/lib/supabase";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

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

      router.replace(me ? "/dashboard" : "/onboarding/join");
    }

    route().finally(() => {
      if (!cancelled) setChecking(false);
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return checking ? null : null;
}
