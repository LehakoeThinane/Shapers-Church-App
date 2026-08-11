import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { Button, Screen, TextField, theme } from "@shapers/ui";
import { matchPerson } from "@shapers/api-client";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

export default function MatchPersonScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ churchId?: string; churchName?: string }>();
  const churchId = params.churchId ?? "";
  const churchName = params.churchName ?? "your church";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    if (!churchId) {
      setError("Missing church — go back and re-enter your invite code.");
      return;
    }
    setLoading(true);
    try {
      const client = getSupabaseClient();
      const {
        data: { user },
      } = await client.auth.getUser();

      await matchPerson(client, {
        churchId,
        firstName,
        lastName,
        phone: phone || undefined,
        email: user?.email ?? undefined,
      });
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(2) }}>
        You&apos;re joining {churchName}
      </Text>
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>
        We&apos;ll try to match you to your existing record. If we can&apos;t, a staff member will
        review it.
      </Text>
      <TextField label="First name" value={firstName} onChangeText={setFirstName} />
      <TextField label="Last name" value={lastName} onChangeText={setLastName} />
      <TextField label="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      {error ? (
        <Text style={{ color: theme.color.danger, marginBottom: theme.spacing(4) }}>{error}</Text>
      ) : null}
      <Button
        title="Finish"
        onPress={onSubmit}
        loading={loading}
        disabled={!firstName.trim() || !lastName.trim()}
      />
    </Screen>
  );
}
