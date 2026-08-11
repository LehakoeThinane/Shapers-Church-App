import { useState } from "react";
import { useRouter, Link } from "expo-router";
import { Text, View } from "react-native";
import { Button, Screen, TextField, theme } from "@shapers/ui";
import { signIn, getCurrentUser } from "@shapers/api-client";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      const client = getSupabaseClient();
      await signIn(client, { email, password });
      const me = await getCurrentUser(client);
      router.replace(me ? "/dashboard" : "/onboarding/join");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(6) }}>
        Log in
      </Text>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      {error ? (
        <Text style={{ color: theme.color.danger, marginBottom: theme.spacing(4) }}>{error}</Text>
      ) : null}
      <Button title="Log in" onPress={onSubmit} loading={loading} />
      <View style={{ marginTop: theme.spacing(4), alignItems: "center" }}>
        <Link href="/(auth)/signup">Need an account? Sign up</Link>
      </View>
    </Screen>
  );
}
