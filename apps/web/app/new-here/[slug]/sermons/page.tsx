"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Linking } from "react-native";
import { GlassCard, LoadingScreen, Screen, Text, theme } from "@shapers/ui";
import { getPublicSermons, type PublicSermon } from "@shapers/api-client";
import { getSupabaseClient } from "@/lib/supabase";
import { getCustomPublic, hasCustomApi } from "@/lib/customApi";
import { logoSource } from "@/lib/logo";

export default function PublicSermonsPage() {
  const { slug } = useParams<{ slug: string }>(); const [sermons, setSermons] = useState<PublicSermon[] | null>(null); const [error, setError] = useState<string | null>(null);
  useEffect(() => { const load = hasCustomApi() ? getCustomPublic<PublicSermon[]>(`/public/churches/${encodeURIComponent(slug)}/sermons`) : getPublicSermons(getSupabaseClient(), slug); load.then(setSermons).catch((err) => { setError(err instanceof Error ? err.message : "Unable to load sermons."); setSermons([]); }); }, [slug]);
  if (!sermons) return <LoadingScreen logoSource={logoSource} />;
  return <Screen logoSource={logoSource}><Link href={`/new-here/${slug}`} style={{ color: theme.color.textMuted, marginBottom: theme.spacing(5) }}>← Back to welcome</Link><Text style={{ fontSize: 30, fontWeight: "700", marginBottom: 6 }}>Recent sermons</Text><Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>Listen to biblical teaching from Shapers Church.</Text>
    {error ? <GlassCard><Text style={{ color: theme.color.danger }}>{error}</Text></GlassCard> : sermons.length === 0 ? <GlassCard><Text>No sermons are published yet.</Text></GlassCard> : sermons.map((sermon) => <GlassCard key={sermon.id} style={{ marginBottom: theme.spacing(3) }}><Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 4 }}>{sermon.title}</Text><Text style={{ color: theme.color.textMuted, marginBottom: 10 }}>{sermon.speaker_name}{sermon.scripture_reference ? ` · ${sermon.scripture_reference}` : ""}</Text>{sermon.video_url || sermon.audio_url ? <Text onPress={() => Linking.openURL(sermon.video_url ?? sermon.audio_url ?? "")} style={{ color: theme.color.primary, fontWeight: "700" }}>Play sermon →</Text> : null}</GlassCard>)}
  </Screen>;
}
