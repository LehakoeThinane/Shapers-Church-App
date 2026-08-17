"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Text, View } from "react-native";
import { Button, Screen, TextField, theme } from "@shapers/ui";
import { signIn, signInWithGoogle, getCurrentUser } from "@shapers/api-client";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

export default function LoginPage() {
  const router = useRouter();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      const client = getSupabaseClient();
      await signIn(client, { email, password });
      const me = await getCurrentUser(client);
      router.push(me ? "/dashboard" : "/onboarding/match");
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
      await signInWithGoogle(getSupabaseClient(), `${window.location.origin}/auth/callback`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setGoogleLoading(false);
    }
  }

  return (
    <Screen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(6) }}>
        Log in
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
            Or log in with email
          </Text>
        </View>
      ) : (
        <View style={{ marginTop: theme.spacing(4) }}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <Button title="Log in" variant="secondary" onPress={onSubmit} loading={loading} />
        </View>
      )}

      <View style={{ marginTop: theme.spacing(4), alignItems: "center" }}>
        <Link href="/signup">Need an account? Sign up</Link>
      </View>
    </Screen>
  );
}
