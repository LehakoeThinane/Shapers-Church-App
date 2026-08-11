"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Text, View } from "react-native";
import { Button, Screen, theme } from "@shapers/ui";
import { getCurrentUser, signOut } from "@shapers/api-client";
import type { CurrentUser } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser(getSupabaseClient())
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          router.replace("/onboarding/join");
          return;
        }
        setMe(result);
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
    router.replace("/login");
  }

  if (loading || !me) return null;

  return (
    <Screen>
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
      <Button title="Sign out" variant="secondary" onPress={onSignOut} />
    </Screen>
  );
}
