import AsyncStorage from "@react-native-async-storage/async-storage";

// Mirrors apps/web/lib/pendingInvite.ts — carries an invite code from
// the join-link screen across signup, since Supabase auth signup
// doesn't hand back any state of its own to thread through.
const KEY = "shapers_pending_invite_code";

export async function setPendingInviteCode(code: string): Promise<void> {
  await AsyncStorage.setItem(KEY, code);
}

export async function getPendingInviteCode(): Promise<string | null> {
  return AsyncStorage.getItem(KEY);
}

export async function clearPendingInviteCode(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
