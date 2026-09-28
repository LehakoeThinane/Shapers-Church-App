import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Button, LoadingScreen, Screen, Text, theme } from "@shapers/ui";
import { getCustomMe, signOutCustom, type CustomMobileUser } from "@/lib/customAuth";
import { logoSource } from "@/lib/logo";

export default function ApiDashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<CustomMobileUser | null>(null);

  useEffect(() => {
    getCustomMe().then((me) => {
      if (!me) router.replace("/(auth)/login");
      else setUser(me);
    });
  }, [router]);

  if (!user) return <LoadingScreen logoSource={logoSource} />;

  return (
    <Screen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(2) }}>
        Welcome, {user.person.first_name}
      </Text>
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(4) }}>
        Your local Shapers API is connected.
      </Text>
      <Text>{user.person.email}</Text>
      <Button title="Sign out" onPress={async () => { await signOutCustom(); router.replace("/(auth)/login"); }} />
    </Screen>
  );
}
