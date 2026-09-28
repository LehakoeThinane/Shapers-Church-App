"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { View } from "react-native";
import { GlassCard, LoadingScreen, Screen, Text, theme } from "@shapers/ui";
import { getSupabaseClient } from "@/lib/supabase";
import { getCustomPublic, hasCustomApi } from "@/lib/customApi";
import { logoSource } from "@/lib/logo";

type PublicChurch = { name: string; slug: string; content: Record<string, string | null>; next_event: { title: string; starts_at: string; location: string | null } | null };

export default function NewHerePage() {
  const { slug } = useParams<{ slug: string }>();
  const [church, setChurch] = useState<PublicChurch | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    async function load() {
      try {
        if (hasCustomApi()) {
          setChurch(await getCustomPublic<PublicChurch>(`/public/churches/${encodeURIComponent(slug)}`));
        } else {
          const { data, error: rpcError } = await getSupabaseClient().rpc("get_public_church", { p_slug: slug });
          if (rpcError) throw rpcError;
          setChurch(data as PublicChurch | null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load church information.");
        setChurch(null);
      }
    }
    void load();
  }, [slug]);
  if (church === undefined) return <LoadingScreen logoSource={logoSource} />;
  if (!church) return <Screen logoSource={logoSource}><Text style={{ color: error ? theme.color.danger : theme.color.text }}>{error ?? "We couldn&apos;t find that church."}</Text></Screen>;
  const content = church.content;
  return <Screen logoSource={logoSource}>
    <Text style={{ fontSize: 32, fontWeight: "700", marginBottom: 8 }}>Welcome to {church.name}</Text>
    <Text style={{ color: theme.color.textMuted, fontSize: 17, marginBottom: theme.spacing(6) }}>{content.mission_statement ?? "A place to meet Jesus, find family, and live with purpose."}</Text>
    {church.next_event ? <GlassCard style={{ marginBottom: theme.spacing(4) }}><Text style={{ color: theme.color.textMuted, marginBottom: 4 }}>Coming up</Text><Text style={{ fontSize: 18, fontWeight: "700" }}>{church.next_event.title}</Text><Text style={{ color: theme.color.textMuted }}>{new Date(church.next_event.starts_at).toLocaleString()}{church.next_event.location ? ` · ${church.next_event.location}` : ""}</Text></GlassCard> : null}
    <GlassCard style={{ marginBottom: theme.spacing(4) }}><Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>What to expect</Text><Text style={{ color: theme.color.textMuted }}>{content.what_to_expect ?? "Come as you are. We would love to welcome you."}</Text></GlassCard>
    {content.beliefs ? <GlassCard style={{ marginBottom: theme.spacing(6) }}><Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>What we believe</Text><Text style={{ color: theme.color.textMuted }}>{content.beliefs}</Text></GlassCard> : null}
    <View style={{ gap: theme.spacing(3) }}><Link href={`/new-here/${church.slug}/sermons`} style={{ color: theme.color.primary, fontWeight: "700" }}>Watch recent sermons →</Link><Link href={`/new-here/${church.slug}/stories`} style={{ color: theme.color.primary, fontWeight: "700" }}>Read stories of grace →</Link><Link href="/signup" style={{ color: theme.color.primary, fontWeight: "700" }}>Plan your visit / create an account →</Link><Link href="/login" style={{ color: theme.color.textMuted }}>Already part of the family? Sign in</Link></View>
  </Screen>;
}
