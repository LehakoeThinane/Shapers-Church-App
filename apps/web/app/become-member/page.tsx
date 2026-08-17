"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Text } from "react-native";
import { Button, Screen, TextField, theme } from "@shapers/ui";
import { becomeMember } from "@shapers/api-client";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

// Manual entry point for an already-signed-up (Tier 1) person to become
// a full member, as an alternative to clicking a /join/[code] link.
export default function BecomeMemberPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await becomeMember(getSupabaseClient(), inviteCode.trim());
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
        Become a member
      </Text>
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>
        Enter the membership invite code your church gave you.
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
