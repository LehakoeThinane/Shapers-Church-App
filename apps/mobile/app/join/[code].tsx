import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "react-native";
import { LoadingScreen, Screen, theme } from "@shapers/ui";
import { becomeMember, findChurchByInviteCode, getCurrentUser } from "@shapers/api-client";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { setPendingInviteCode } from "@/lib/pendingInvite";

// Reached via a shapers://join/<code> deep link (or a universal link,
// once one is configured) — mirrors apps/web/app/join/[code]/page.tsx.
export default function JoinLinkScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function route() {
      const client = getSupabaseClient();
      const church = await findChurchByInviteCode(client, code);
      if (!church) {
        if (!cancelled) setError("This invite link isn't valid — check it with whoever sent it to you.");
        return;
      }

      const {
        data: { session },
      } = await client.auth.getSession();

      if (!session) {
        await setPendingInviteCode(code);
        router.replace("/(auth)/signup");
        return;
      }

      const me = await getCurrentUser(client);
      if (cancelled) return;

      if (me) {
        // Already signed up (Tier 1 or already a member) — redeem the
        // code in place instead of just bouncing to the dashboard.
        await becomeMember(client, code);
        if (!cancelled) router.replace("/dashboard");
        return;
      }

      router.replace({
        pathname: "/onboarding/match",
        params: { churchId: church.id, churchName: church.name },
      });
    }

    route().catch((err) => setError(err instanceof Error ? err.message : "Something went wrong"));

    return () => {
      cancelled = true;
    };
  }, [code, router]);

  if (error) {
    return (
      <Screen logoSource={logoSource}>
        <Text style={{ color: theme.color.danger }}>{error}</Text>
      </Screen>
    );
  }

  return <LoadingScreen logoSource={logoSource} />;
}
