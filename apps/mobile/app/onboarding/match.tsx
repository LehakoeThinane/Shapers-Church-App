import { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Button, Screen, Text, TextField, theme } from "@shapers/ui";
import { becomeMember, getDefaultChurch, matchPerson } from "@shapers/api-client";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { clearPendingInviteCode, getPendingInviteCode } from "@/lib/pendingInvite";

export default function MatchPersonScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ churchId?: string; churchName?: string }>();
  const churchIdParam = params.churchId;

  const [churchName, setChurchName] = useState(params.churchName ?? "your church");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.churchName) return;
    // No church passed in via params (the normal case now that signup
    // doesn't need an invite code) — look up the one church that exists
    // just to show its real name instead of the generic fallback.
    getDefaultChurch(getSupabaseClient())
      .then((church) => church && setChurchName(church.name))
      .catch(() => {});
  }, [params.churchName]);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      const client = getSupabaseClient();
      const {
        data: { user },
      } = await client.auth.getUser();

      const church = churchIdParam ? { id: churchIdParam } : await getDefaultChurch(client);
      if (!church) {
        setError("Couldn't find your church — contact your church admin.");
        return;
      }

      await matchPerson(client, {
        churchId: church.id,
        firstName,
        lastName,
        phone: phone || undefined,
        email: user?.email ?? undefined,
      });

      // Arrived via a membership invite link (/join/[code]) — the code
      // sits in storage from before signup; redeem it now that onboarding
      // (this step) is done.
      const pendingCode = await getPendingInviteCode();
      if (pendingCode) {
        await becomeMember(client, pendingCode);
        await clearPendingInviteCode();
      }

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
