import { useEffect, useState } from "react";
import { useRouter, Link } from "expo-router";
import { Text, View } from "react-native";
import { Button, LoadingScreen, Screen, theme } from "@shapers/ui";
import { getCurrentUser, getMilestones, signOut } from "@shapers/api-client";
import type { CurrentUser, PersonMilestone } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

export default function DashboardScreen() {
  const router = useRouter();
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [milestones, setMilestones] = useState<PersonMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const client = getSupabaseClient();
    getCurrentUser(client)
      .then(async (result) => {
        if (cancelled) return;
        if (!result) {
          router.replace("/onboarding/join");
          return;
        }
        setMe(result);
        const m = await getMilestones(client, result.person.id);
        if (!cancelled) setMilestones(m);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSignOut() {
    await signOut(getSupabaseClient());
    router.replace("/(auth)/login");
  }

  if (loading || !me) return <LoadingScreen logoSource={logoSource} />;

  const roles = new Set(me.roleAssignments.map((ra) => ra.role));
  const canCheckIn = roles.has("admin") || roles.has("kids_staff");
  const isGuardian = roles.has("guardian");

  return (
    <Screen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(2) }}>
        Welcome, {me.person.first_name}
      </Text>
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>
        {me.household ? me.household.name ?? "Household" : "No household on file yet"}
      </Text>
      <View style={{ marginBottom: theme.spacing(6) }}>
        <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>Roles</Text>
        {me.roleAssignments.length === 0 ? (
          <Text style={{ color: theme.color.textMuted }}>No roles assigned</Text>
        ) : (
          me.roleAssignments.map((ra) => (
            <Text key={ra.id} style={{ color: theme.color.text }}>
              {ra.role}
              {ra.scope_type ? ` (${ra.scope_type})` : ""}
            </Text>
          ))
        )}
      </View>

      {milestones.length > 0 ? (
        <View style={{ marginBottom: theme.spacing(6) }}>
          <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>Milestones</Text>
          {milestones.map((m) => (
            <Text key={m.id}>
              {m.milestone_type} — {m.achieved_at}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={{ marginBottom: theme.spacing(1) }}>
        <Link href="/groups">Groups</Link>
      </View>
      <View style={{ marginBottom: theme.spacing(1) }}>
        <Link href="/courses">Courses</Link>
      </View>
      <View style={{ marginBottom: theme.spacing(1) }}>
        <Link href="/announcements">Announcements</Link>
      </View>
      <View style={{ marginBottom: theme.spacing(1) }}>
        <Link href="/events">Events</Link>
      </View>
      <View style={{ marginBottom: theme.spacing(6) }}>
        <Link href="/prayer">Prayer wall</Link>
      </View>

      {isGuardian || canCheckIn ? (
        <View style={{ marginBottom: theme.spacing(6) }}>
          <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>Check-in</Text>
          {isGuardian ? (
            <Link href="/checkin" style={{ marginBottom: theme.spacing(1) }}>
              My children&apos;s QR codes
            </Link>
          ) : null}
          {canCheckIn ? (
            <>
              <Link href="/checkin/scan" style={{ marginBottom: theme.spacing(1) }}>
                Check in (staff)
              </Link>
              <Link href="/checkin/pickup">Pickup (staff)</Link>
            </>
          ) : null}
        </View>
      ) : null}

      <Button title="Sign out" variant="secondary" onPress={onSignOut} />
    </Screen>
  );
}
