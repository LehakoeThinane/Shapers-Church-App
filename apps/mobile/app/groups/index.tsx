import { useEffect, useState } from "react";
import { Link } from "expo-router";
import { View } from "react-native";
import { LoadingScreen, Screen, Text, theme } from "@shapers/ui";
import { getGroups } from "@shapers/api-client";
import type { MinistryGroup } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

const TYPE_LABELS: Record<MinistryGroup["group_type"], string> = {
  circuit: "Circuits",
  cell: "Cells",
  department: "Departments",
  committee: "Committees",
};

export default function GroupsScreen() {
  const [groups, setGroups] = useState<MinistryGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getGroups(getSupabaseClient())
      .then((result) => {
        if (!cancelled) setGroups(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
      });
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

  if (!groups) return <LoadingScreen logoSource={logoSource} />;

  const byType = groups.reduce<Record<string, MinistryGroup[]>>((acc, g) => {
    (acc[g.group_type] ??= []).push(g);
    return acc;
  }, {});

  return (
    <Screen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(6) }}>Groups</Text>
      {groups.length === 0 ? (
        <Text style={{ color: theme.color.textMuted }}>
          No groups visible to you yet — you&apos;ll see groups here once you&apos;re assigned to
          one.
        </Text>
      ) : (
        (Object.keys(TYPE_LABELS) as MinistryGroup["group_type"][]).map((type) =>
          byType[type]?.length ? (
            <View key={type} style={{ marginBottom: theme.spacing(6) }}>
              <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>
                {TYPE_LABELS[type]}
              </Text>
              {byType[type].map((g) => (
                <Link key={g.id} href={`/groups/${g.id}`} style={{ paddingVertical: 6 }}>
                  {g.name}
                </Link>
              ))}
            </View>
          ) : null
        )
      )}
      <Link href="/dashboard">Back to dashboard</Link>
    </Screen>
  );
}
