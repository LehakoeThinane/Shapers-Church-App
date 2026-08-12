import type {
  AttendanceEntry,
  GroupMemberWithPerson,
  GroupMeeting,
  GroupReport,
  MinistryGroup,
  SubmitGroupReportInput,
} from "@shapers/types";
import type { ShapersClient } from "./client";

export type GroupType = "circuit" | "cell" | "department" | "committee";

// GET /groups?type=...
// RLS already scopes this to what the caller can see (admin: all,
// circuit_leader: own circuit's groups, cell_leader: own group,
// member: groups they belong to) — see
// supabase/migrations/20260812140005_groups_rls.sql.
export async function getGroups(client: ShapersClient, type?: GroupType): Promise<MinistryGroup[]> {
  let query = client.from("ministry_group").select("*").order("name");
  if (type) query = query.eq("group_type", type);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// GET /groups/:id
export async function getGroup(client: ShapersClient, groupId: string): Promise<MinistryGroup | null> {
  const { data, error } = await client.from("ministry_group").select("*").eq("id", groupId).maybeSingle();
  if (error) throw error;
  return data;
}

// GET /groups/:id/members
export async function getGroupMembers(
  client: ShapersClient,
  groupId: string
): Promise<GroupMemberWithPerson[]> {
  const { data: members, error: membersError } = await client
    .from("group_member")
    .select("*")
    .eq("group_id", groupId)
    .order("joined_at");
  if (membersError) throw membersError;
  if (!members || members.length === 0) return [];

  const personIds = [...new Set(members.map((m) => m.person_id))];
  const { data: people, error: peopleError } = await client
    .from("person")
    .select("id, first_name, last_name")
    .in("id", personIds);
  if (peopleError) throw peopleError;

  const personById = new Map((people ?? []).map((p) => [p.id, p]));
  return members.map((member) => ({
    member,
    person: personById.get(member.person_id) ?? {
      id: member.person_id,
      first_name: "Unknown",
      last_name: "",
    },
  }));
}

// Meetings logged for a group, most recent first — used to pick which
// meeting to report on.
export async function getGroupMeetings(client: ShapersClient, groupId: string): Promise<GroupMeeting[]> {
  const { data, error } = await client
    .from("group_meeting")
    .select("*")
    .eq("group_id", groupId)
    .order("meeting_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Existing attendance rows for a meeting, keyed for easy lookup while
// pre-filling the attendance form.
export async function getMeetingAttendance(
  client: ShapersClient,
  meetingId: string
): Promise<Record<string, boolean>> {
  const { data, error } = await client
    .from("group_attendance")
    .select("person_id, present")
    .eq("meeting_id", meetingId);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((a) => [a.person_id, a.present]));
}

// The report for a meeting, if one's already been submitted —
// group_report has a unique constraint on meeting_id, so at most one.
export async function getMeetingReport(
  client: ShapersClient,
  meetingId: string
): Promise<GroupReport | null> {
  const { data, error } = await client
    .from("group_report")
    .select("*")
    .eq("meeting_id", meetingId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// POST /groups/:id/meetings
export async function createMeeting(
  client: ShapersClient,
  churchId: string,
  groupId: string,
  meetingDate: string,
  location?: string
): Promise<GroupMeeting> {
  const { data, error } = await client
    .from("group_meeting")
    .insert({ church_id: churchId, group_id: groupId, meeting_date: meetingDate, location })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// POST /meetings/:id/attendance — replaces any existing attendance rows
// for this meeting with the given list (upsert on the unique
// (meeting_id, person_id) constraint).
export async function recordAttendance(
  client: ShapersClient,
  churchId: string,
  meetingId: string,
  entries: AttendanceEntry[]
): Promise<void> {
  const { error } = await client.from("group_attendance").upsert(
    entries.map((e) => ({
      church_id: churchId,
      meeting_id: meetingId,
      person_id: e.personId,
      present: e.present,
    })),
    { onConflict: "meeting_id,person_id" }
  );
  if (error) throw error;
}

// POST /meetings/:id/report
export async function submitGroupReport(
  client: ShapersClient,
  churchId: string,
  meetingId: string,
  input: SubmitGroupReportInput
): Promise<GroupReport> {
  const { data, error } = await client
    .from("group_report")
    .insert({
      church_id: churchId,
      meeting_id: meetingId,
      attendance_count: input.attendanceCount,
      offering_amount: input.offeringAmount,
      testimonies: input.testimonies,
      is_exception: input.isException ?? false,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// GET /circuits/:id/reports — aggregated reports across all cells in a
// circuit (circuit_leader+ only, per RLS on group_report).
export async function getCircuitReports(
  client: ShapersClient,
  circuitGroupId: string
): Promise<{ report: GroupReport; meeting: GroupMeeting; group: MinistryGroup }[]> {
  const { data: groups, error: groupsError } = await client
    .from("ministry_group")
    .select("*")
    .or(`id.eq.${circuitGroupId},parent_group_id.eq.${circuitGroupId}`);
  if (groupsError) throw groupsError;

  const groupIds = (groups ?? []).map((g) => g.id);
  const groupById = new Map((groups ?? []).map((g) => [g.id, g]));

  const { data: meetings, error: meetingsError } = await client
    .from("group_meeting")
    .select("*")
    .in("group_id", groupIds);
  if (meetingsError) throw meetingsError;
  if (!meetings || meetings.length === 0) return [];

  const meetingById = new Map(meetings.map((m) => [m.id, m]));
  const { data: reports, error: reportsError } = await client
    .from("group_report")
    .select("*")
    .in(
      "meeting_id",
      meetings.map((m) => m.id)
    )
    .order("created_at", { ascending: false });
  if (reportsError) throw reportsError;

  return (reports ?? []).flatMap((report) => {
    const meeting = meetingById.get(report.meeting_id);
    const group = meeting ? groupById.get(meeting.group_id) : undefined;
    if (!meeting || !group) return [];
    return [{ report, meeting, group }];
  });
}
