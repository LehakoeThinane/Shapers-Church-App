import type { Database, Role, RoleScopeType } from "./database";

export type Church = Database["public"]["Tables"]["church"]["Row"];
export type Household = Database["public"]["Tables"]["household"]["Row"];
export type Person = Database["public"]["Tables"]["person"]["Row"];
export type AppUser = Database["public"]["Tables"]["app_user"]["Row"];
export type RoleAssignment = Database["public"]["Tables"]["role_assignment"]["Row"];
export type ChurchIntegration = Database["public"]["Tables"]["church_integration"]["Row"];
export type Checkin = Database["public"]["Tables"]["checkin"]["Row"];
export type CheckinTag = Database["public"]["Tables"]["checkin_tag"]["Row"];
export type MinistryGroup = Database["public"]["Tables"]["ministry_group"]["Row"];
export type GroupMember = Database["public"]["Tables"]["group_member"]["Row"];
export type GroupMeeting = Database["public"]["Tables"]["group_meeting"]["Row"];
export type GroupAttendance = Database["public"]["Tables"]["group_attendance"]["Row"];
export type GroupReport = Database["public"]["Tables"]["group_report"]["Row"];
export type Course = Database["public"]["Tables"]["course"]["Row"];
export type Lesson = Database["public"]["Tables"]["lesson"]["Row"];
export type Quiz = Database["public"]["Tables"]["quiz"]["Row"];
export type PersonProgress = Database["public"]["Tables"]["person_progress"]["Row"];
export type PersonMilestone = Database["public"]["Tables"]["person_milestone"]["Row"];
export type Announcement = Database["public"]["Tables"]["announcement"]["Row"];
export type Event = Database["public"]["Tables"]["event"]["Row"];
export type EventRsvp = Database["public"]["Tables"]["event_rsvp"]["Row"];
export type PrayerRequest = Database["public"]["Tables"]["prayer_request"]["Row"];

export type { Role, RoleScopeType };

// GET /me
export interface CurrentUser {
  person: Person;
  household: Household | null;
  roleAssignments: RoleAssignment[];
}

// GET /checkin-tags/me — this week's QR tokens for my children, with
// enough person info to render a labeled card per child.
export interface MyCheckinTag {
  tag: CheckinTag;
  child: Pick<Person, "id" | "first_name" | "last_name">;
}

// Result of POST /checkin/scan
export interface CheckinScanResult {
  checkinId: string;
  personId: string;
  firstName: string;
  lastName: string;
  securityCode: string;
}

// Result of POST /checkin/:id/pickup
export interface CheckinPickupResult {
  checkinId: string;
  personId: string;
  checkedOutAt: string;
}

// A currently-checked-in child, for the staff pickup list.
export interface OpenCheckin {
  checkin: Checkin;
  child: Pick<Person, "id" | "first_name" | "last_name">;
}

// GET /groups/:id/members — a membership row with enough person info to
// render a roster.
export interface GroupMemberWithPerson {
  member: GroupMember;
  person: Pick<Person, "id" | "first_name" | "last_name">;
}

// POST /meetings/:id/attendance — one entry per person marked.
export interface AttendanceEntry {
  personId: string;
  present: boolean;
}

// POST /meetings/:id/report
export interface SubmitGroupReportInput {
  attendanceCount?: number;
  offeringAmount?: number;
  testimonies?: string;
  isException?: boolean;
}

// GET /courses/:id — course + lessons, each flagged with the caller's
// own completion state.
export interface CourseWithLessons {
  course: Course;
  lessons: (Lesson & { progress: PersonProgress | null })[];
}

// A quiz question without the answer — see get_quiz_questions() in
// supabase/migrations/20260812150006_courses_functions.sql, which
// never returns correct_option.
export interface QuizQuestionForTaking {
  id: string;
  question_text: string;
  options: { key: string; text: string }[];
  position: number;
}

// { "<question_id>": "<selected_option_key>" }
export type QuizAnswers = Record<string, string>;

// GET /events — each flagged with the caller's own RSVP, if any.
export interface EventWithRsvp {
  event: Event;
  myRsvp: EventRsvp | null;
}

// GET /prayer-requests — is_anonymous is enforced here, not by hiding
// submitted_by in the row itself (admins still need it for follow-up):
// submitterName is only populated when the viewer is allowed to see it.
export interface PrayerRequestForDisplay {
  request: PrayerRequest;
  submitterName: string | null;
}
