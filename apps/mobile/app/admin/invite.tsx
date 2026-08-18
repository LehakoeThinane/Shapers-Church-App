import { useEffect, useState } from "react";
import { Link } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Text, View } from "react-native";
import { Button, GlassCard, LoadingScreen, Screen, theme } from "@shapers/ui";
import { getChurch, getChurchInviteCode, getCurrentUser } from "@shapers/api-client";
import type { Church, CurrentUser } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

// No universal-link domain configured yet (see the header note in
// apps/mobile/app/join/[code].tsx) — this shares the deep-link scheme
// directly, which only opens the app for someone who already has it
// installed. Fine for now; swap for a real https:// link once one exists.
export default function AdminInviteScreen() {
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
      <Screen logoSource={logoSource}>
        <Text style={{ color: theme.color.danger }}>{error}</Text>
      </Screen>
    );
  }

  if (!me) return <LoadingScreen logoSource={logoSource} />;

  const isAdmin = me.roleAssignments.some((ra) => ra.role === "admin");
  if (!isAdmin) {
    return (
      <Screen logoSource={logoSource}>
        <Text style={{ color: theme.color.danger, marginBottom: theme.spacing(4) }}>
          Admins only.
        </Text>
        <Link href="/dashboard">Back to dashboard</Link>
      </Screen>
    );
  }

  if (!church || !inviteCode) return <LoadingScreen logoSource={logoSource} />;

  const link = `shapers://join/${inviteCode}`;

  async function copy(value: string, which: "link" | "code") {
    await Clipboard.setStringAsync(value);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <Screen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(2) }}>
        Invite a member to {church.name}
      </Text>
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>
        Anyone can already sign up and browse without this — this code/link is for someone
        ready to become a full member. It unlocks courses and the prayer wall for them.
      </Text>

      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(2) }}>
        Invite code
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

      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(2) }}>
        App link
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

      <Link href="/dashboard">Back to dashboard</Link>
    </Screen>
  );
}
