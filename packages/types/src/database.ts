// Hand-written Supabase `Database` type for the tables that exist as of
// Phase 1 (identity & tenancy). Once the Supabase CLI is pointed at a real
// project, replace this file with the output of:
//   supabase gen types typescript --project-id <ref> > packages/types/src/database.ts
// and re-add the phase-specific comments by hand, since codegen overwrites
// the whole file.
//
// `Relationships: []` on every table is a stand-in for the FK-derived
// array real codegen produces — harmless since nothing here uses
// PostgREST's embedded-resource (`select("*, other_table(*)")`) syntax
// yet, but required structurally: supabase-js's GenericTable type expects
// it, and its absence silently collapses all RPC arg/return types to
// `never` (which is what surfaced this while wiring up the onboarding
// RPCs — see api-client/src/onboarding.ts and src/me.ts).

export type Role =
  | "admin"
  | "circuit_leader"
  | "cell_leader"
  | "kids_staff"
  | "guardian"
  | "member";

export type RoleScopeType = "church" | "circuit" | "cell" | "household";

export interface Database {
  public: {
    Tables: {
      church: {
        Row: {
          id: string;
          name: string;
          timezone: string;
          invite_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          timezone?: string;
          invite_code?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["church"]["Insert"]>;
        Relationships: [];
      };
      household: {
        Row: {
          id: string;
          church_id: string;
          pc_household_id: string | null;
          name: string | null;
          synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          pc_household_id?: string | null;
          name?: string | null;
          synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["household"]["Insert"]>;
        Relationships: [];
      };
      person: {
        Row: {
          id: string;
          church_id: string;
          household_id: string | null;
          pc_person_id: string | null;
          first_name: string;
          last_name: string;
          date_of_birth: string | null;
          is_minor: boolean;
          email: string | null;
          phone: string | null;
          synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          household_id?: string | null;
          pc_person_id?: string | null;
          first_name: string;
          last_name: string;
          date_of_birth?: string | null;
          is_minor?: boolean;
          email?: string | null;
          phone?: string | null;
          synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["person"]["Insert"]>;
        Relationships: [];
      };
      app_user: {
        Row: {
          id: string;
          person_id: string;
          church_id: string;
          email: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          person_id: string;
          church_id: string;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["app_user"]["Insert"]>;
        Relationships: [];
      };
      role_assignment: {
        Row: {
          id: string;
          church_id: string;
          person_id: string;
          role: Role;
          scope_type: RoleScopeType | null;
          scope_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          person_id: string;
          role: Role;
          scope_type?: RoleScopeType | null;
          scope_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["role_assignment"]["Insert"]>;
        Relationships: [];
      };
      church_integration: {
        Row: {
          id: string;
          church_id: string;
          provider: "planning_center";
          encrypted_token: string;
          connected_by: string | null;
          connected_at: string;
          last_synced_at: string | null;
          status: "active" | "token_expired" | "error";
        };
        Insert: {
          id?: string;
          church_id: string;
          provider: "planning_center";
          encrypted_token: string;
          connected_by?: string | null;
          connected_at?: string;
          last_synced_at?: string | null;
          status?: "active" | "token_expired" | "error";
        };
        Update: Partial<Database["public"]["Tables"]["church_integration"]["Insert"]>;
        Relationships: [];
      };
      checkin: {
        Row: {
          id: string;
          church_id: string;
          person_id: string;
          checked_in_at: string;
          checked_out_at: string | null;
          security_code: string | null;
          pc_checkin_id: string | null;
          sync_status: "pending" | "synced" | "failed";
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          person_id: string;
          checked_in_at?: string;
          checked_out_at?: string | null;
          security_code?: string | null;
          pc_checkin_id?: string | null;
          sync_status?: "pending" | "synced" | "failed";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["checkin"]["Insert"]>;
        Relationships: [];
      };
      checkin_tag: {
        Row: {
          id: string;
          church_id: string;
          person_id: string;
          week_start_date: string;
          qr_token: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          person_id: string;
          week_start_date: string;
          qr_token: string;
          expires_at: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["checkin_tag"]["Insert"]>;
        Relationships: [];
      };
      ministry_group: {
        Row: {
          id: string;
          church_id: string;
          parent_group_id: string | null;
          group_type: "circuit" | "cell" | "department" | "committee";
          name: string;
          leader_person_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          parent_group_id?: string | null;
          group_type: "circuit" | "cell" | "department" | "committee";
          name: string;
          leader_person_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ministry_group"]["Insert"]>;
        Relationships: [];
      };
      group_member: {
        Row: {
          id: string;
          church_id: string;
          group_id: string;
          person_id: string;
          role: "leader" | "assistant" | "member";
          is_primary: boolean;
          joined_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          group_id: string;
          person_id: string;
          role?: "leader" | "assistant" | "member";
          is_primary?: boolean;
          joined_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["group_member"]["Insert"]>;
        Relationships: [];
      };
      group_meeting: {
        Row: {
          id: string;
          church_id: string;
          group_id: string;
          meeting_date: string;
          location: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          group_id: string;
          meeting_date: string;
          location?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["group_meeting"]["Insert"]>;
        Relationships: [];
      };
      group_attendance: {
        Row: {
          id: string;
          church_id: string;
          meeting_id: string;
          person_id: string;
          present: boolean;
        };
        Insert: {
          id?: string;
          church_id: string;
          meeting_id: string;
          person_id: string;
          present?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["group_attendance"]["Insert"]>;
        Relationships: [];
      };
      group_report: {
        Row: {
          id: string;
          church_id: string;
          meeting_id: string;
          attendance_count: number | null;
          offering_amount: number | null;
          testimonies: string | null;
          is_exception: boolean;
          submitted_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          meeting_id: string;
          attendance_count?: number | null;
          offering_amount?: number | null;
          testimonies?: string | null;
          is_exception?: boolean;
          submitted_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["group_report"]["Insert"]>;
        Relationships: [];
      };
      course: {
        Row: {
          id: string;
          church_id: string;
          title: string;
          course_type: "sermon_series" | "program";
          unlocks_milestone: string | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          title: string;
          course_type: "sermon_series" | "program";
          unlocks_milestone?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["course"]["Insert"]>;
        Relationships: [];
      };
      lesson: {
        Row: {
          id: string;
          church_id: string;
          course_id: string;
          position: number;
          title: string;
          content_type: "video" | "text" | "pdf";
          content_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          course_id: string;
          position: number;
          title: string;
          content_type: "video" | "text" | "pdf";
          content_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lesson"]["Insert"]>;
        Relationships: [];
      };
      quiz: {
        Row: {
          id: string;
          church_id: string;
          lesson_id: string;
          passing_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          lesson_id: string;
          passing_score?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quiz"]["Insert"]>;
        Relationships: [];
      };
      quiz_question: {
        Row: {
          id: string;
          church_id: string;
          quiz_id: string;
          question_text: string;
          options: { key: string; text: string }[];
          correct_option: string;
          position: number;
        };
        Insert: {
          id?: string;
          church_id: string;
          quiz_id: string;
          question_text: string;
          options: { key: string; text: string }[];
          correct_option: string;
          position?: number;
        };
        Update: Partial<Database["public"]["Tables"]["quiz_question"]["Insert"]>;
        Relationships: [];
      };
      person_progress: {
        Row: {
          id: string;
          church_id: string;
          person_id: string;
          lesson_id: string;
          completed_at: string | null;
          quiz_score: number | null;
        };
        Insert: {
          id?: string;
          church_id: string;
          person_id: string;
          lesson_id: string;
          completed_at?: string | null;
          quiz_score?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["person_progress"]["Insert"]>;
        Relationships: [];
      };
      person_milestone: {
        Row: {
          id: string;
          church_id: string;
          person_id: string;
          milestone_type: string;
          achieved_at: string;
          source_course_id: string | null;
          sync_status: "pending" | "synced" | "failed";
          pc_synced_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          person_id: string;
          milestone_type: string;
          achieved_at?: string;
          source_course_id?: string | null;
          sync_status?: "pending" | "synced" | "failed";
          pc_synced_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["person_milestone"]["Insert"]>;
        Relationships: [];
      };
      announcement: {
        Row: {
          id: string;
          church_id: string;
          title: string;
          body: string;
          published_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          title: string;
          body: string;
          published_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["announcement"]["Insert"]>;
        Relationships: [];
      };
      event: {
        Row: {
          id: string;
          church_id: string;
          title: string;
          description: string | null;
          starts_at: string;
          ends_at: string | null;
          location: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          title: string;
          description?: string | null;
          starts_at: string;
          ends_at?: string | null;
          location?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["event"]["Insert"]>;
        Relationships: [];
      };
      event_rsvp: {
        Row: {
          id: string;
          church_id: string;
          event_id: string;
          person_id: string;
          status: "going" | "maybe" | "declined";
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          event_id: string;
          person_id: string;
          status?: "going" | "maybe" | "declined";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["event_rsvp"]["Insert"]>;
        Relationships: [];
      };
      prayer_request: {
        Row: {
          id: string;
          church_id: string;
          submitted_by: string | null;
          request_text: string;
          is_anonymous: boolean;
          is_approved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          submitted_by?: string | null;
          request_text: string;
          is_anonymous?: boolean;
          is_approved?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["prayer_request"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      find_church_by_invite_code: {
        Args: { p_invite_code: string };
        Returns: { id: string; name: string }[];
      };
      get_default_church: {
        Args: Record<string, never>;
        Returns: { id: string; name: string }[];
      };
      onboard_match_person: {
        Args: {
          p_church_id: string;
          p_first_name: string;
          p_last_name: string;
          p_phone?: string | null;
          p_email?: string | null;
        };
        Returns: string;
      };
      onboard_become_member: {
        Args: { p_invite_code: string };
        Returns: undefined;
      };
      checkin_scan: {
        Args: { p_qr_token: string };
        Returns: {
          checkin_id: string;
          person_id: string;
          first_name: string;
          last_name: string;
          security_code: string;
        }[];
      };
      checkin_pickup: {
        Args: { p_checkin_id: string; p_qr_token: string };
        Returns: { checkin_id: string; person_id: string; checked_out_at: string }[];
      };
      get_quiz_questions: {
        Args: { p_quiz_id: string };
        Returns: {
          id: string;
          question_text: string;
          options: { key: string; text: string }[];
          position: number;
        }[];
      };
      submit_quiz_answers: {
        Args: { p_quiz_id: string; p_answers: Record<string, string> };
        Returns: number;
      };
      complete_lesson: {
        Args: { p_lesson_id: string; p_quiz_score?: number | null };
        Returns: string | null;
      };
      get_church_invite_code: {
        Args: { p_church_id: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
  };
}
