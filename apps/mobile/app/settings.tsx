import { useEffect, useState } from "react";
import { Link, useRouter } from "expo-router";
import { Button, GlassCard, LoadingScreen, Screen, Text, theme } from "@shapers/ui";
import { getCustomMe, signOutCustom, type CustomMobileUser } from "@/lib/customAuth";
import { logoSource } from "@/lib/logo";

export default function SettingsScreen() {
  const router = useRouter();
  const [me, setMe] = useState<CustomMobileUser | null>(null);
  useEffect(() => { getCustomMe().then((result) => result ? setMe(result) : router.replace("/(auth)/login")); }, [router]);
  if (!me) return <LoadingScreen logoSource={logoSource} />;
  return <Screen logoSource={logoSource}>
    <Link href="/dashboard" style={{ marginBottom: theme.spacing(4) }}>← Back</Link>
    <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: theme.spacing(1) }}>Account settings</Text>
    <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(5) }}>Manage your Shapers Church account.</Text>
    <GlassCard style={{ marginBottom: theme.spacing(4) }}>
      <Text style={{ fontWeight: "700", marginBottom: theme.spacing(3) }}>Profile</Text>
      <Text>{me.person.first_name} {me.person.last_name}</Text>
      <Text style={{ color: theme.color.textMuted, marginTop: theme.spacing(1) }}>{me.person.email}</Text>
      {me.person.phone ? <Text style={{ color: theme.color.textMuted, marginTop: theme.spacing(1) }}>{me.person.phone}</Text> : null}
    </GlassCard>
    <GlassCard style={{ marginBottom: theme.spacing(5) }}>
      <Text style={{ fontWeight: "700", marginBottom: theme.spacing(2) }}>Security</Text>
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(3) }}>Your session is secured by the Shapers API.</Text>
      <Button title="Sign out" variant="secondary" onPress={async () => { await signOutCustom(); router.replace("/(auth)/login"); }} />
    </GlassCard>
    <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>Shapers Church · Version 1.0</Text>
  </Screen>;
}
