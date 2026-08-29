"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoadingScreen, Screen, Text, theme } from "@shapers/ui";
import { becomeMember, findChurchByInviteCode, getCurrentUser } from "@shapers/api-client";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { setPendingInviteCode } from "@/lib/pendingInvite";

// The shareable link an admin copies from /admin/invite. Resolves the
// code and routes straight to the right onboarding step instead of
// making a new member type an 8-character code by hand.
export default function JoinLinkPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function route() {
      const client = getSupabaseClient();
      const church = await findChurchByInviteCode(client, params.code);
      if (!church) {
        if (!cancelled) setError("This invite link isn't valid — check it with whoever sent it to you.");
        return;
      }

      const {
        data: { session },
      } = await client.auth.getSession();

      if (!session) {
        // Remembered across signup — see app/(auth)/signup/page.tsx.
        setPendingInviteCode(params.code);
        router.replace("/signup");
        return;
      }

      const me = await getCurrentUser(client);
      if (cancelled) return;

      if (me) {
        // Already signed up (Tier 1 or already a member) — redeem the
        // code in place instead of just bouncing to the dashboard.
        await becomeMember(client, params.code);
        if (!cancelled) router.replace("/dashboard");
        return;
      }

      router.replace(
        `/onboarding/match?churchId=${church.id}&churchName=${encodeURIComponent(church.name)}`
      );
    }

    route().catch((err) => setError(err instanceof Error ? err.message : "Something went wrong"));

    return () => {
      cancelled = true;
    };
  }, [params.code, router]);

  if (error) {
    return (
      <Screen logoSource={logoSource}>
        <Text style={{ color: theme.color.danger }}>{error}</Text>
      </Screen>
    );
  }

  return <LoadingScreen logoSource={logoSource} />;
}
