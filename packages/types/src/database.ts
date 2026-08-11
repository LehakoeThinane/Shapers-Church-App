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
    };
    Views: Record<string, never>;
    Functions: {
      find_church_by_invite_code: {
        Args: { p_invite_code: string };
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
    };
    Enums: Record<string, never>;
  };
}
