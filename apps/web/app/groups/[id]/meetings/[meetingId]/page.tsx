"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Switch, Text, View } from "react-native";
import { Button, GlassCard, LoadingScreen, Screen, TextField, theme } from "@shapers/ui";
import {
  getCurrentUser,
  getGroupMembers,
  getMeetingAttendance,
  getMeetingReport,
  recordAttendance,
  submitGroupReport,
} from "@shapers/api-client";
import type { GroupMemberWithPerson, GroupReport } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

export default function MeetingPage() {
  const params = useParams<{ id: string; meetingId: string }>();
  const { id: groupId, meetingId } = params;

  const [members, setMembers] = useState<GroupMemberWithPerson[] | null>(null);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [report, setReport] = useState<GroupReport | null>(null);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);

  const [attendanceCount, setAttendanceCount] = useState("");
  const [offeringAmount, setOfferingAmount] = useState("");
  const [testimonies, setTestimonies] = useState("");
  const [isException, setIsException] = useState(false);

  async function load() {
    const client = getSupabaseClient();
    const [m, a, r, me] = await Promise.all([
      getGroupMembers(client, groupId),
      getMeetingAttendance(client, meetingId),
      getMeetingReport(client, meetingId),
      getCurrentUser(client),
    ]);
    setMembers(m);
    setAttendance(a);
    setReport(r);
    setChurchId(me?.person.church_id ?? null);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Something went wrong"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, meetingId]);

  async function onSaveAttendance() {
    if (!churchId || !members) return;
    setError(null);
    setSavingAttendance(true);
    try {
      await recordAttendance(
        getSupabaseClient(),
        churchId,
        meetingId,
        members.map(({ person }) => ({
          personId: person.id,
          present: attendance[person.id] ?? true,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSavingAttendance(false);
    }
  }

  async function onSubmitReport() {
    if (!churchId) return;
    setError(null);
    setSubmittingReport(true);
    try {
      const result = await submitGroupReport(getSupabaseClient(), churchId, meetingId, {
        attendanceCount: attendanceCount ? Number(attendanceCount) : undefined,
        offeringAmount: offeringAmount ? Number(offeringAmount) : undefined,
        testimonies: testimonies || undefined,
        isException: isException,
      });
      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmittingReport(false);
    }
  }

  if (error) {
    return (
      <Screen logoSource={logoSource}>
        <Text style={{ color: theme.color.danger }}>{error}</Text>
      </Screen>
    );
  }

  if (!members) return <LoadingScreen logoSource={logoSource} />;

  return (
    <Screen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(6) }}>
        Meeting
      </Text>

      <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>Attendance</Text>
      <View style={{ marginBottom: theme.spacing(4) }}>
        {members.map(({ member, person }) => (
          <View
            key={member.id}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: theme.spacing(1),
            }}
          >
            <Text>
              {person.first_name} {person.last_name}
            </Text>
            <Switch
              value={attendance[person.id] ?? true}
              onValueChange={(value) =>
                setAttendance((prev) => ({ ...prev, [person.id]: value }))
              }
            />
          </View>
        ))}
      </View>
      <Button title="Save attendance" onPress={onSaveAttendance} loading={savingAttendance} />

      <View style={{ marginTop: theme.spacing(8) }}>
        <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>Report</Text>
        {report ? (
          <GlassCard>
            <Text>Attendance count: {report.attendance_count ?? "—"}</Text>
            <Text>Offering: {report.offering_amount ?? "—"}</Text>
            <Text>Testimonies: {report.testimonies || "—"}</Text>
            <Text>Exception: {report.is_exception ? "Yes" : "No"}</Text>
          </GlassCard>
        ) : (
          <View>
            <TextField
              label="Attendance count"
              value={attendanceCount}
              onChangeText={setAttendanceCount}
              keyboardType="number-pad"
            />
            <TextField
              label="Offering amount"
              value={offeringAmount}
              onChangeText={setOfferingAmount}
              keyboardType="decimal-pad"
            />
            <TextField label="Testimonies / notes" value={testimonies} onChangeText={setTestimonies} />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: theme.spacing(4),
              }}
            >
              <Text>Flag as exception</Text>
              <Switch value={isException} onValueChange={setIsException} />
            </View>
            <Button title="Submit report" onPress={onSubmitReport} loading={submittingReport} />
          </View>
        )}
      </View>

      <View style={{ marginTop: theme.spacing(6) }}>
        <Link href={`/groups/${groupId}`}>Back to group</Link>
      </View>
    </Screen>
  );
}
