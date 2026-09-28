import { useState } from "react";
import { Link, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { GlassCard, Screen, Text, theme } from "@shapers/ui";
import { logoSource } from "@/lib/logo";

const stages = [
  { title: "Purpose", detail: "Understand how God has shaped you.", sessions: "4 sessions" },
  { title: "Pursuit", detail: "Build rhythms that help you grow.", sessions: "6 sessions" },
  { title: "Partner", detail: "Find people who help you become.", sessions: "5 sessions" },
  { title: "Produce", detail: "Use your gifts to serve others.", sessions: "7 sessions" },
];

export default function JourneyScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<number | null>(0);
  return <Screen logoSource={logoSource}>
    <Link href="/dashboard" style={{ marginBottom: theme.spacing(4) }}>← Back</Link>
    <Text style={{ color: theme.color.textMuted, letterSpacing: 2, fontSize: 11, fontWeight: "700", marginBottom: theme.spacing(2) }}>YOUR GROWTH PATH</Text>
    <Text style={{ fontSize: 30, fontWeight: "700", marginBottom: theme.spacing(1) }}>Purpose Journey</Text>
    <Text style={{ color: theme.color.textMuted, lineHeight: 22, marginBottom: theme.spacing(6) }}>Purpose · Pursuit · Partner · Produce</Text>
    {stages.map((stage, index) => <Pressable key={stage.title} onPress={() => setExpanded(expanded === index ? null : index)} style={{ marginBottom: theme.spacing(3) }}>
      <GlassCard variant={expanded === index ? "elevated" : "default"}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1 }}><Text style={{ color: theme.color.textMuted, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>STAGE {index + 1}</Text><Text style={{ fontSize: 21, fontWeight: "700" }}>{stage.title}</Text></View>
          <Text style={{ fontSize: 22 }}>{expanded === index ? "−" : "+"}</Text>
        </View>
        {expanded === index ? <View style={{ marginTop: theme.spacing(3) }}><Text style={{ color: theme.color.textMuted, lineHeight: 21, marginBottom: theme.spacing(2) }}>{stage.detail}</Text><Text style={{ fontSize: 12, color: theme.color.textMuted }}>{stage.sessions} · Coming soon</Text></View> : null}
      </GlassCard>
    </Pressable>)}
    <Pressable onPress={() => router.push("/journey/assessment")}><GlassCard><Text style={{ fontWeight: "700", marginBottom: 6 }}>Discover your gifts →</Text><Text style={{ color: theme.color.textMuted }}>Take the purpose assessment when it is ready.</Text></GlassCard></Pressable>
  </Screen>;
}
