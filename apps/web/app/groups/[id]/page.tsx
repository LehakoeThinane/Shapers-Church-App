"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Text, View } from "react-native";
import { Button, LoadingScreen, Screen, TextField, theme } from "@shapers/ui";
import { createMeeting, getCurrentUser, getGroup, getGroupMeetings, getGroupMembers } from "@shapers/api-client";
import type { GroupMeeting, GroupMemberWithPerson, MinistryGroup } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const groupId = params.id;

  const [group, setGroup] = useState<MinistryGroup | null>(null);
  const [members, setMembers] = useState<GroupMemberWithPerson[] | null>(null);
  const [meetings, setMeetings] = useState<GroupMeeting[] | null>(null);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [meetingDate, setMeetingDate] = useState("");
  const [location, setLocation] = useState("");
  const [logging, setLogging] = useState(false);

  async function load() {
    const client = getSupabaseClient();
    const [g, m, ms, me] = await Promise.all([
      getGroup(client, groupId),
      getGroupMembers(client, groupId),
      getGroupMeetings(client, groupId),
      getCurrentUser(client),
    ]);
    setGroup(g);
    setMembers(m);
    setMeetings(ms);
    setChurchId(me?.person.church_id ?? null);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Something went wrong"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  async function onLogMeeting() {
    if (!churchId) return;
    setError(null);
    setLogging(true);
    try {
      await createMeeting(getSupabaseClient(), churchId, groupId, meetingDate, location || undefined);
      setMeetingDate("");
      setLocation("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLogging(false);
    }
  }

  if (error) {
    return (
      <Screen logoSource={logoSource}>
        <Text style={{ color: theme.color.danger }}>{error}</Text>
      </Screen>
    );
  }

  if (!group || !members || !meetings) return <LoadingScreen logoSource={logoSource} />;

  return (
    <Screen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>{group.name}</Text>
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>
        {group.group_type}
      </Text>

      {group.group_type === "circuit" ? (
        <View style={{ marginBottom: theme.spacing(4) }}>
          <Link href={`/groups/${group.id}/reports`}>View circuit reports</Link>
        </View>
      ) : null}

      <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>
        Members ({members.length})
      </Text>
      <View style={{ marginBottom: theme.spacing(6) }}>
        {members.length === 0 ? (
          <Text style={{ color: theme.color.textMuted }}>No members yet.</Text>
        ) : (
          members.map(({ member, person }) => (
            <Text key={member.id} style={{ paddingVertical: 2 }}>
              {person.first_name} {person.last_name}
              {member.role !== "member" ? ` (${member.role})` : ""}
            </Text>
          ))
        )}
      </View>

      <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>Meetings</Text>
      <View style={{ marginBottom: theme.spacing(4) }}>
        {meetings.length === 0 ? (
          <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(2) }}>
            No meetings logged yet.
          </Text>
        ) : (
          meetings.map((m) => (
            <Link
              key={m.id}
              href={`/groups/${group.id}/meetings/${m.id}`}
              style={{ display: "block", paddingTop: 4, paddingBottom: 4 }}
            >
              {m.meeting_date}
              {m.location ? ` — ${m.location}` : ""}
            </Link>
          ))
        )}
      </View>

      <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>Log a meeting</Text>
      <TextField
        label="Date (YYYY-MM-DD)"
        value={meetingDate}
        onChangeText={setMeetingDate}
        placeholder="2026-08-17"
      />
      <TextField label="Location (optional)" value={location} onChangeText={setLocation} />
      <Button
        title="Log meeting"
        onPress={onLogMeeting}
        loading={logging}
        disabled={!meetingDate.trim()}
      />

      <View style={{ marginTop: theme.spacing(6) }}>
        <Link href="/groups">Back to groups</Link>
      </View>
    </Screen>
  );
}
