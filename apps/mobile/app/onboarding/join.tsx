import { useState } from "react";
import { useRouter } from "expo-router";
import { Text } from "react-native";
import { Button, Screen, TextField, theme } from "@shapers/ui";
import { findChurchByInviteCode } from "@shapers/api-client";
import { getSupabaseClient } from "@/lib/supabase";

export default function JoinChurchScreen() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      const church = await findChurchByInviteCode(getSupabaseClient(), inviteCode.trim());
      if (!church) {
        setError("No church found for that invite code.");
        return;
      }
      router.push({
        pathname: "/onboarding/match",
        params: { churchId: church.id, churchName: church.name },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(2) }}>
        Find your church
      </Text>
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>
        Enter the invite code your church gave you.
      </Text>
      <TextField
        label="Invite code"
        value={inviteCode}
        onChangeText={setInviteCode}
        autoCapitalize="characters"
      />
      {error ? (
        <Text style={{ color: theme.color.danger, marginBottom: theme.spacing(4) }}>{error}</Text>
      ) : null}
      <Button title="Continue" onPress={onSubmit} loading={loading} disabled={!inviteCode.trim()} />
    </Screen>
  );
}
