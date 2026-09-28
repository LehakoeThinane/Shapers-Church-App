import { useState } from "react";
import { Link } from "expo-router";
import { Pressable, View } from "react-native";
import { GlassCard, Screen, Text, theme } from "@shapers/ui";
import { logoSource } from "@/lib/logo";

const sermons = [
  { title: "The Providence of God", speaker: "Shapers Church", detail: "Trusting God when the path is not obvious.", length: "32 min" },
  { title: "Built for Belonging", speaker: "Shapers Church", detail: "Faith grows best in community.", length: "28 min" },
  { title: "A Life That Matters", speaker: "Shapers Church", detail: "Discover the joy of purposeful living.", length: "35 min" },
];

export default function SermonsScreen() {
  const [saved, setSaved] = useState<string[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  return <Screen logoSource={logoSource}>
    <Link href="/dashboard" style={{ marginBottom: theme.spacing(4) }}>← Back</Link>
    <Text style={{ color: theme.color.textMuted, letterSpacing: 2, fontSize: 11, fontWeight: "700", marginBottom: theme.spacing(2) }}>WATCH & LISTEN</Text>
    <Text style={{ fontSize: 30, fontWeight: "700", marginBottom: theme.spacing(1) }}>Sermons</Text>
    <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(5) }}>Messages for your Monday, your middle, and your next step.</Text>
    {sermons.map((sermon) => { const isSaved = saved.includes(sermon.title); const isPlaying = playing === sermon.title; return <GlassCard key={sermon.title} style={{ marginBottom: theme.spacing(3) }}><Text style={{ color: theme.color.textMuted, fontSize: 11, fontWeight: "700", marginBottom: 7 }}>{sermon.length.toUpperCase()}</Text><Text style={{ fontSize: 21, fontWeight: "700", marginBottom: 5 }}>{sermon.title}</Text><Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(2) }}>{sermon.detail}</Text><Text style={{ fontSize: 12, color: theme.color.textMuted, marginBottom: theme.spacing(3) }}>{sermon.speaker}</Text>{isPlaying ? <Text style={{ color: theme.color.success, marginBottom: theme.spacing(2) }}>Preview playing · {sermon.length}</Text> : null}<View style={{ flexDirection: "row", gap: theme.spacing(4) }}><Pressable onPress={() => setSaved(isSaved ? saved.filter((item) => item !== sermon.title) : [...saved, sermon.title])}><Text style={{ fontWeight: "700" }}>{isSaved ? "Saved" : "Save"}</Text></Pressable><Pressable onPress={() => setPlaying(isPlaying ? null : sermon.title)}><Text style={{ fontWeight: "700" }}>{isPlaying ? "Pause" : "Play preview →"}</Text></Pressable></View></GlassCard>; })}
  </Screen>;
}
