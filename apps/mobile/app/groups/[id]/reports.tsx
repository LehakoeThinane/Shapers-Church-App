import { useEffect, useState } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { LoadingScreen, Screen, theme } from "@shapers/ui";
import { getCircuitReports } from "@shapers/api-client";
import type { GroupMeeting, GroupReport, MinistryGroup } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

export default function CircuitReportsScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();

  const [rows, setRows] = useState<{ report: GroupReport; meeting: GroupMeeting; group: MinistryGroup }[] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCircuitReports(getSupabaseClient(), groupId)
      .then((result) => {
        if (!cancelled) setRows(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
      });
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  if (error) {
    return (
      <Screen logoSource={logoSource}>
        <Text style={{ color: theme.color.danger }}>{error}</Text>
      </Screen>
    );
  }

  if (!rows) return <LoadingScreen logoSource={logoSource} />;

  return (
    <Screen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(6) }}>
        Circuit reports
      </Text>
      {rows.length === 0 ? (
        <Text style={{ color: theme.color.textMuted }}>No reports submitted yet.</Text>
      ) : (
        rows.map(({ report, meeting, group }) => (
          <View
            key={report.id}
            style={{
              paddingVertical: theme.spacing(3),
              borderBottomWidth: 1,
              borderBottomColor: theme.color.border,
            }}
          >
            <Text style={{ fontWeight: "600" }}>
              {group.name} — {meeting.meeting_date}
              {report.is_exception ? " ⚠" : ""}
            </Text>
            <Text style={{ color: theme.color.textMuted }}>
              Attendance: {report.attendance_count ?? "—"} · Offering: {report.offering_amount ?? "—"}
            </Text>
            {report.testimonies ? <Text>{report.testimonies}</Text> : null}
          </View>
        ))
      )}
      <View style={{ marginTop: theme.spacing(6) }}>
        <Link href={`/groups/${groupId}`}>Back to group</Link>
      </View>
    </Screen>
  );
}
