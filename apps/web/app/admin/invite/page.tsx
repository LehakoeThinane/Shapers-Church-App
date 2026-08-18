"use client";

import { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, GlassCard, LoadingScreen, Text, theme } from "@shapers/ui";
import { AuthenticatedScreen } from "@/components/AuthenticatedScreen";
import { getChurch, getChurchInviteCode, getCurrentUser } from "@shapers/api-client";
import type { Church, CurrentUser } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

export default function AdminInvitePage() {
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [church, setChurch] = useState<Church | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const client = getSupabaseClient();
      const currentUser = await getCurrentUser(client);
      if (cancelled) return;
      setMe(currentUser);
      if (!currentUser) return;

      const churchRow = await getChurch(client, currentUser.person.church_id);
      if (cancelled) return;
      setChurch(churchRow);

      const isAdmin = currentUser.roleAssignments.some((ra) => ra.role === "admin");
      if (isAdmin) {
        const code = await getChurchInviteCode(client, currentUser.person.church_id);
        if (!cancelled) setInviteCode(code);
      }
    }
    load().catch((err) => setError(err instanceof Error ? err.message : "Something went wrong"));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <AuthenticatedScreen logoSource={logoSource}>
        <Text style={{ color: theme.color.danger }}>{error}</Text>
      </AuthenticatedScreen>
    );
  }

  if (!me) return <LoadingScreen logoSource={logoSource} />;

  const isAdmin = me.roleAssignments.some((ra) => ra.role === "admin");
  if (!isAdmin) {
    return (
      <AuthenticatedScreen logoSource={logoSource}>
        <Text style={{ color: theme.color.danger, marginBottom: theme.spacing(4) }}>
          Admins only.
        </Text>
      </AuthenticatedScreen>
    );
  }

  if (!church || !inviteCode) return <LoadingScreen logoSource={logoSource} />;

  const link =
    typeof window !== "undefined" ? `${window.location.origin}/join/${inviteCode}` : "";

  async function copy(value: string, which: "link" | "code") {
    await navigator.clipboard.writeText(value);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <AuthenticatedScreen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(2) }}>
        Invite a member to {church.name}
      </Text>
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>
        Anyone can already sign up and browse without this — this link is for someone ready to
        become a full member. It unlocks courses and the prayer wall for them.
      </Text>

      <GlassCard style={{ marginBottom: theme.spacing(2) }}>
        <Text style={{ fontWeight: "600" }}>{link}</Text>
      </GlassCard>
      <View style={{ marginBottom: theme.spacing(6) }}>
        <Button
          title={copied === "link" ? "Copied!" : "Copy link"}
          variant="secondary"
          onPress={() => copy(link, "link")}
        />
      </View>

      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(2) }}>
        Or just the invite code, for someone who&apos;ll type it in themselves:
      </Text>
      <GlassCard style={{ marginBottom: theme.spacing(2) }}>
        <Text style={{ fontWeight: "600", fontSize: 20, letterSpacing: 2 }}>
          {inviteCode}
        </Text>
      </GlassCard>
      <View style={{ marginBottom: theme.spacing(6) }}>
        <Button
          title={copied === "code" ? "Copied!" : "Copy code"}
          variant="secondary"
          onPress={() => copy(inviteCode, "code")}
        />
      </View>
    </AuthenticatedScreen>
  );
}
