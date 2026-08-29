"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { View } from "react-native";
import { GlassCard, LoadingScreen, Text, theme } from "@shapers/ui";
import { getCircuitReports } from "@shapers/api-client";
import type { GroupMeeting, GroupReport, MinistryGroup } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { AuthenticatedScreen } from "@/components/AuthenticatedScreen";

export default function CircuitReportsPage() {
  const params = useParams<{ id: string }>();
  const groupId = params.id;

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
      <AuthenticatedScreen logoSource={logoSource}>
        <Text style={{ color: theme.color.danger }}>{error}</Text>
      </AuthenticatedScreen>
    );
  }

  if (!rows) return <LoadingScreen logoSource={logoSource} />;

  return (
    <AuthenticatedScreen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(6) }}>
        Circuit reports
      </Text>
      {rows.length === 0 ? (
        <Text style={{ color: theme.color.textMuted }}>No reports submitted yet.</Text>
      ) : (
        rows.map(({ report, meeting, group }) => (
          <GlassCard key={report.id} style={{ marginBottom: theme.spacing(3) }}>
            <Text style={{ fontWeight: "600" }}>
              {group.name} — {meeting.meeting_date}
              {report.is_exception ? " ⚠" : ""}
            </Text>
            <Text style={{ color: theme.color.textMuted }}>
              Attendance: {report.attendance_count ?? "—"} · Offering: {report.offering_amount ?? "—"}
            </Text>
            {report.testimonies ? <Text>{report.testimonies}</Text> : null}
          </GlassCard>
        ))
      )}
      <View style={{ marginTop: theme.spacing(2) }}>
        <Link href={`/groups/${groupId}`}>Back to group</Link>
      </View>
    </AuthenticatedScreen>
  );
}
