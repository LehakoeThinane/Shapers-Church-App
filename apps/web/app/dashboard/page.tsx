"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Image, View } from "react-native";
import { GlassCard, LoadingScreen, Text, theme } from "@shapers/ui";
import { getCurrentUser, getMilestones } from "@shapers/api-client";
import type { CurrentUser, PersonMilestone } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { AuthenticatedScreen } from "@/components/AuthenticatedScreen";

export default function DashboardPage() {
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
          router.replace("/onboarding/match");
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

  if (loading || !me) return <LoadingScreen logoSource={logoSource} />;

  const roles = new Set(me.roleAssignments.map((ra) => ra.role));
  const canCheckIn = roles.has("admin") || roles.has("kids_staff");
  const isGuardian = roles.has("guardian");
  const isMember = roles.has("member");

  return (
    <AuthenticatedScreen logoSource={logoSource}>
      <View
        style={{
          borderRadius: theme.radius.lg,
          overflow: "hidden",
          marginBottom: theme.spacing(6),
          shadowColor: "#FFFFFF",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.18,
          shadowRadius: 20,
        }}
      >
        {/* Current sermon series banner — swap the image or hide this
            block once there's an admin screen to manage it; hardcoded
            for now, same as the rest of the pre-CRUD content. */}
        {/* eslint-disable-next-line jsx-a11y/alt-text -- accessibilityLabel
            below maps to alt at runtime; see components/QrCode.tsx */}
        <Image
          source={{ uri: "/series-banner.jpg" }}
          accessibilityLabel="Current sermon series: The Providence of God"
          resizeMode="cover"
          style={{ width: "100%", aspectRatio: 16 / 9 }}
        />
      </View>

      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(2) }}>
        Welcome, {me.person.first_name}
      </Text>
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(2) }}>
        {me.household ? me.household.name ?? "Household" : "No household on file yet"}
      </Text>
      {me.household ? (
        <Link
          href="/household"
          style={{ color: theme.color.primary, marginBottom: theme.spacing(6), display: "block" }}
        >
          View household members →
        </Link>
      ) : (
        <View style={{ marginBottom: theme.spacing(6) }} />
      )}

      <GlassCard style={{ marginBottom: theme.spacing(4) }}>
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
      </GlassCard>

      {milestones.length > 0 ? (
        <GlassCard style={{ marginBottom: theme.spacing(4) }}>
          <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>Milestones</Text>
          {milestones.map((m) => (
            <Text key={m.id}>
              {m.milestone_type} — {m.achieved_at}
            </Text>
          ))}
        </GlassCard>
      ) : null}

      {!isMember ? (
        <GlassCard style={{ marginBottom: theme.spacing(4) }}>
          <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>Become a member</Text>
          <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(2) }}>
            Unlocks courses and the prayer wall.
          </Text>
          <Link href="/become-member">Become a member</Link>
        </GlassCard>
      ) : null}

      {roles.has("admin") ? (
        <GlassCard style={{ marginBottom: theme.spacing(4) }}>
          <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>Admin</Text>
          <Link href="/admin/invite" style={{ display: "block", marginBottom: theme.spacing(1) }}>
            Invite people
          </Link>
          <Link href="/admin/integrations">
            Church integrations
          </Link>
        </GlassCard>
      ) : null}

      <GlassCard style={{ marginBottom: theme.spacing(4) }}>
        <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>Account</Text>
        <Link href="/settings" style={{ display: "block" }}>
          Settings
        </Link>
      </GlassCard>

      {isGuardian || canCheckIn ? (
        <GlassCard style={{ marginBottom: theme.spacing(4) }}>
          <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>Check-in</Text>
          {isGuardian ? (
            <Link href="/checkin" style={{ display: "block", marginBottom: theme.spacing(1) }}>
              My children&apos;s QR codes
            </Link>
          ) : null}
          {canCheckIn ? (
            <>
              <Link href="/checkin/scan" style={{ display: "block", marginBottom: theme.spacing(1) }}>
                Check in (staff)
              </Link>
              <Link href="/checkin/pickup" style={{ display: "block" }}>
                Pickup (staff)
              </Link>
            </>
          ) : null}
        </GlassCard>
      ) : null}
    </AuthenticatedScreen>
  );
}
