// Carries an invite code from /join/[code] across the signup step,
// since Supabase auth signup doesn't hand back any state of its own to
// thread through — see app/join/[code]/page.tsx and app/(auth)/signup/page.tsx.
const KEY = "shapers_pending_invite_code";

export function setPendingInviteCode(code: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, code);
}

export function getPendingInviteCode(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

export function clearPendingInviteCode() {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
}
