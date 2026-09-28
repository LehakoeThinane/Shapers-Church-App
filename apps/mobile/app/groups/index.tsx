import { useState } from "react";
import { Link } from "expo-router";
import { Pressable, View } from "react-native";
import { GlassCard, Screen, Text, theme } from "@shapers/ui";
import { logoSource } from "@/lib/logo";

const groups = [
  { id: "young-adults", type: "COMMUNITY", name: "Young Adults", detail: "A weekly space to grow, ask honest questions, and build meaningful friendships.", schedule: "Thursdays · 18:30" },
  { id: "shapers-men", type: "COMMUNITY", name: "Shapers Men", detail: "Conversation, prayer, and practical faith for men who want to keep becoming.", schedule: "Saturdays · 08:00" },
  { id: "worship-team", type: "SERVE", name: "Worship Team", detail: "Use your gifts to help create room for worship and connection on Sundays.", schedule: "Sundays · 07:30" },
];

export default function GroupsScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [joinRequested, setJoinRequested] = useState<string[]>([]);
  return (
    <Screen logoSource={logoSource}>
      <Link href="/dashboard" style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>← Back to dashboard</Link>
      <Text style={{ color: theme.color.textMuted, letterSpacing: 2, fontSize: 11, fontWeight: "700" }}>CONNECT</Text>
      <Text style={{ fontSize: 30, fontWeight: "700", marginTop: theme.spacing(1), marginBottom: theme.spacing(2) }}>Find your people</Text>
      <Text style={{ color: theme.color.textMuted, lineHeight: 21, marginBottom: theme.spacing(6) }}>Groups are a simple way to grow in community. Tap a group to see the rhythm and next step.</Text>
      {groups.map((group) => {
        const isSelected = selected === group.id;
        return (
          <Pressable key={group.id} onPress={() => setSelected(isSelected ? null : group.id)} style={{ marginBottom: theme.spacing(3) }}>
            <GlassCard variant={isSelected ? "elevated" : "default"}>
              <Text style={{ color: theme.color.textMuted, letterSpacing: 1.5, fontSize: 10, fontWeight: "700", marginBottom: theme.spacing(2) }}>{group.type}</Text>
              <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: theme.spacing(1) }}>{group.name}</Text>
              <Text style={{ color: theme.color.textMuted }}>{isSelected ? group.detail : group.schedule}</Text>
              {isSelected ? <View style={{ marginTop: theme.spacing(4), borderTopWidth: 1, borderTopColor: theme.color.border, paddingTop: theme.spacing(3) }}><Text style={{ fontWeight: "700" }}>{group.schedule}</Text><Text style={{ color: theme.color.textMuted, marginTop: theme.spacing(1) }}>A leader will follow up with the next available gathering.</Text><Pressable onPress={() => setJoinRequested((current) => current.includes(group.id) ? current.filter((id) => id !== group.id) : [...current, group.id])} style={{ marginTop: theme.spacing(3) }}><Text style={{ fontWeight: "700" }}>{joinRequested.includes(group.id) ? "Request sent ✓" : "Request to join →"}</Text></Pressable></View> : null}
            </GlassCard>
          </Pressable>
        );
      })}
    </Screen>
  );
}
