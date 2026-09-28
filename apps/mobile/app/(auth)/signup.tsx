import { useState } from "react";
import { Link, useRouter } from "expo-router";
import { View } from "react-native";
import { Button, Screen, Text, TextField, theme } from "@shapers/ui";
import { signUpCustom } from "@/lib/customAuth";
import { logoSource } from "@/lib/logo";

export default function SignUpScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signUpCustom({ firstName, lastName, email, password, churchInviteCode: inviteCode });
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(2) }}>Create your account</Text>
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(4) }}>Use the invite code from your church.</Text>
      <TextField label="First name" value={firstName} onChangeText={setFirstName} />
      <TextField label="Last name" value={lastName} onChangeText={setLastName} />
      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TextField label="Church invite code" value={inviteCode} onChangeText={setInviteCode} autoCapitalize="none" />
      {error ? <Text style={{ color: theme.color.danger, marginTop: theme.spacing(3) }}>{error}</Text> : null}
      <Button title="Create account" onPress={onSubmit} loading={loading} />
      <View style={{ marginTop: theme.spacing(4), alignItems: "center" }}><Link href="/(auth)/login">Already have an account? Sign in</Link></View>
    </Screen>
  );
}
