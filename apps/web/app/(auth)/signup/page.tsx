"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Text, View } from "react-native";
import { Button, Screen, TextField, theme } from "@shapers/ui";
import {
  becomeMember,
  getDefaultChurch,
  matchPerson,
  signInWithGoogle,
  signUp,
} from "@shapers/api-client";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { clearPendingInviteCode, getPendingInviteCode } from "@/lib/pendingInvite";

export default function SignupPage() {
  const router = useRouter();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      const client = getSupabaseClient();
      await signUp(client, { email, password });

      // Single-church deployment — the church auto-resolves, no invite
      // code needed just to join.
      const church = await getDefaultChurch(client);
      if (!church) {
        setError("Couldn't find your church — contact your church admin.");
        return;
      }
      await matchPerson(client, { churchId: church.id, firstName, lastName, email });

      // Arrived via a membership invite link (/join/[code]) — redeem it
      // now that the account is fully set up.
      const pendingCode = getPendingInviteCode();
      if (pendingCode) {
        await becomeMember(client, pendingCode);
        clearPendingInviteCode();
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);
    try {
      // The pending invite code (if any) already sits in localStorage from
      // /join/[code] — the /auth/callback route picks it up after the
      // redirect back from Google, same as onSubmit does above for
      // password signup.
      await signInWithGoogle(getSupabaseClient(), `${window.location.origin}/auth/callback`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setGoogleLoading(false);
    }
  }

  return (
    <Screen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(2) }}>
        Create your account
      </Text>
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(4) }}>
        One tap — we&apos;ll get your name from Google, nothing to type.
      </Text>
      <Button title="Continue with Google" onPress={onGoogleSignIn} loading={googleLoading} />
      {error ? (
        <Text style={{ color: theme.color.danger, marginTop: theme.spacing(4) }}>{error}</Text>
      ) : null}

      {!showEmailForm ? (
        <View style={{ marginTop: theme.spacing(4), alignItems: "center" }}>
          <Text
            onPress={() => setShowEmailForm(true)}
            style={{ color: theme.color.textMuted, textDecorationLine: "underline" }}
          >
            Or sign up with email
          </Text>
        </View>
      ) : (
        <View style={{ marginTop: theme.spacing(4) }}>
          <TextField label="First name" value={firstName} onChangeText={setFirstName} />
          <TextField label="Last name" value={lastName} onChangeText={setLastName} />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <Button
            title="Sign up"
            variant="secondary"
            onPress={onSubmit}
            loading={loading}
            disabled={!firstName.trim() || !lastName.trim()}
          />
        </View>
      )}

      <View style={{ marginTop: theme.spacing(4), alignItems: "center" }}>
        <Link href="/login">Already have an account? Log in</Link>
      </View>
    </Screen>
  );
}
