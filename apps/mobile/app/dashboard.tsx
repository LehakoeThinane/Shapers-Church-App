import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { Button, GlassCard, LoadingScreen, Screen, Text, theme } from "@shapers/ui";
import { getCustomMe, signOutCustom, type CustomMobileUser } from "@/lib/customAuth";
import { logoSource } from "@/lib/logo";

function roleLabel(role: string) {
  return role.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const destinations = [
  { eyebrow: "GROW", title: "Purpose Journey", detail: "Discover your next step", route: "/journey" },
  { eyebrow: "LISTEN", title: "Sermons", detail: "Find encouragement for the week", route: "/sermons" },
  { eyebrow: "CONNECT", title: "Groups", detail: "Do life in community", route: "/groups" },
  { eyebrow: "CARE", title: "Prayer", detail: "Share a request or pray for others", route: "/prayer" },
];

export default function DashboardScreen() {
  const router = useRouter();
  const [me, setMe] = useState<CustomMobileUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCustomMe()
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          router.replace("/(auth)/login");
          return;
        }
        setMe(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [router]);

  async function onSignOut() {
    await signOutCustom();
    router.replace("/(auth)/login");
  }

  if (loading || !me) return <LoadingScreen logoSource={logoSource} />;

  return (
    <Screen logoSource={logoSource}>
      <Text style={{ color: theme.color.textMuted, letterSpacing: 2, fontSize: 12, fontWeight: "700", marginBottom: theme.spacing(2) }}>SHAPERS CHURCH</Text>
      <Text style={{ fontSize: 32, fontWeight: "700", marginBottom: theme.spacing(1) }}>Welcome, {me.person.first_name}</Text>
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>A place to belong, grow, and live with purpose.</Text>

      <GlassCard variant="elevated" style={{ marginBottom: theme.spacing(5) }}>
        <Text style={{ color: theme.color.textMuted, letterSpacing: 1.5, fontSize: 11, fontWeight: "700", marginBottom: theme.spacing(2) }}>YOUR NEXT STEP</Text>
        <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: theme.spacing(1) }}>Keep becoming</Text>
        <Text style={{ color: theme.color.textMuted, lineHeight: 21 }}>Your journey is personal. Start where you are and take one faithful step today.</Text>
        <Pressable onPress={() => router.push("/journey")} style={{ marginTop: theme.spacing(4) }}>
          <Text style={{ fontWeight: "700" }}>Open Purpose Journey  →</Text>
        </Pressable>
      </GlassCard>

      <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: theme.spacing(3) }}>Explore</Text>
      {destinations.map((item) => (
        <Pressable key={item.route} onPress={() => router.push(item.route as never)} style={{ marginBottom: theme.spacing(3) }}>
          <GlassCard>
            <Text style={{ color: theme.color.textMuted, letterSpacing: 1.5, fontSize: 10, fontWeight: "700", marginBottom: theme.spacing(2) }}>{item.eyebrow}</Text>
            <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: theme.spacing(1) }}>{item.title}</Text>
            <Text style={{ color: theme.color.textMuted }}>{item.detail}</Text>
          </GlassCard>
        </Pressable>
      ))}

      <GlassCard style={{ marginBottom: theme.spacing(4) }}>
        <Text style={{ fontWeight: "700", marginBottom: theme.spacing(2) }}>Account</Text>
        <Text>{me.person.email}</Text>
        <Text style={{ color: theme.color.success, marginTop: theme.spacing(1) }}>Connected</Text>
        <Pressable onPress={() => router.push("/settings")} style={{ marginTop: theme.spacing(3) }}>
          <Text style={{ fontWeight: "700" }}>Open account settings  →</Text>
        </Pressable>
      </GlassCard>

      <GlassCard style={{ marginBottom: theme.spacing(5) }}>
        <Text style={{ fontWeight: "700", marginBottom: theme.spacing(2) }}>Your roles</Text>
        {me.roleAssignments.length === 0 ? (
          <Text style={{ color: theme.color.textMuted }}>No roles assigned yet.</Text>
        ) : me.roleAssignments.map((assignment) => (
          <Text key={assignment.role} style={{ marginBottom: theme.spacing(1) }}>{roleLabel(assignment.role)}</Text>
        ))}
      </GlassCard>

      <Button title="Sign out" variant="secondary" onPress={onSignOut} />
    </Screen>
  );
}
