"use client";

import { useEffect, useState } from "react";
import { Linking, View } from "react-native";
import { GlassCard, LoadingScreen, Text, theme } from "@shapers/ui";
import { getSermons } from "@shapers/api-client";
import type { Sermon } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { AuthenticatedScreen } from "@/components/AuthenticatedScreen";

export default function SermonsPage() {
  const [sermons, setSermons] = useState<Sermon[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { getSermons(getSupabaseClient()).then(setSermons).catch((err) => setError(err instanceof Error ? err.message : "Unable to load sermons.")); }, []);
  if (!sermons) return <LoadingScreen logoSource={logoSource} />;
  return <AuthenticatedScreen logoSource={logoSource}>
    <Text style={{ fontSize: 30, fontWeight: "700", marginBottom: 6 }}>Sermons</Text>
    <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>Listen again, wherever you are.</Text>
    {error ? <GlassCard><Text style={{ color: theme.color.danger }}>{error}</Text></GlassCard> : sermons.length === 0 ? <GlassCard><Text>No sermons are published yet.</Text></GlassCard> : sermons.map((sermon) => <GlassCard key={sermon.id} style={{ marginBottom: theme.spacing(3) }}>
      <Text style={{ fontSize: 19, fontWeight: "700", marginBottom: 4 }}>{sermon.title}</Text>
      <Text style={{ color: theme.color.textMuted, marginBottom: 10 }}>{sermon.speaker_name}{sermon.scripture_reference ? ` · ${sermon.scripture_reference}` : ""}</Text>
      {sermon.video_url || sermon.audio_url ? <Text onPress={() => Linking.openURL(sermon.video_url ?? sermon.audio_url ?? "")} style={{ color: theme.color.primary, fontWeight: "600" }}>Play sermon →</Text> : null}
    </GlassCard>)}
  </AuthenticatedScreen>;
}
