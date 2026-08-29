"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingScreen, Screen, Text, theme } from "@shapers/ui";
import { becomeMember, completeGoogleOnboarding, getCurrentUser } from "@shapers/api-client";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { clearPendingInviteCode, getPendingInviteCode } from "@/lib/pendingInvite";

// Landing page after the Google OAuth redirect. The browser Supabase client
// parses the auth code out of the URL as part of its own init
// (detectSessionInUrl), so by the time getSession() resolves here the
// session already exists — this page just has to route the person
// onward, the same way signup/page.tsx does for password signup.
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function route() {
      const client = getSupabaseClient();

      const {
        data: { session },
      } = await client.auth.getSession();
      if (cancelled) return;
      if (!session) {
        setError("Sign-in didn't complete — please try again.");
        return;
      }

      const me = await getCurrentUser(client);
      if (cancelled) return;
      if (me) {
        router.replace("/dashboard");
        return;
      }

      // Google already gave us a name — join silently instead of making
      // them retype it on a form. Only fall back to the manual screen if
      // Google somehow didn't return enough to work with.
      const personId = await completeGoogleOnboarding(client);
      if (cancelled) return;
      if (!personId) {
        router.replace("/onboarding/match");
        return;
      }

      const pendingCode = getPendingInviteCode();
      if (pendingCode) {
        await becomeMember(client, pendingCode);
        clearPendingInviteCode();
      }

      router.replace("/dashboard");
    }

    route().catch((err) => setError(err instanceof Error ? err.message : "Something went wrong"));

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
