import { useState } from "react";
import { Link, useRouter } from "expo-router";
import { View } from "react-native";
import { Button, Screen, Text, TextField, theme } from "@shapers/ui";
import { logoSource } from "@/lib/logo";
import { signInCustom } from "@/lib/customAuth";

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
      await signInCustom(email, password);
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
        Welcome back
      </Text>
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(4) }}>
        Sign in with the email and password you created for your church.
      </Text>
      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <Text style={{ color: theme.color.danger, marginTop: theme.spacing(4) }}>{error}</Text> : null}
      <Button title="Log in" onPress={onSubmit} loading={loading} />
      <View style={{ marginTop: theme.spacing(4), alignItems: "center" }}>
        <Link href="/(auth)/signup">Need an account? Sign up with your invite code</Link>
      </View>
    </Screen>
  );
}
