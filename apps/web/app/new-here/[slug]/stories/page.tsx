"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { GlassCard, LoadingScreen, Screen, Text, theme } from "@shapers/ui";
import { getPublicTestimonies, type PublicTestimony } from "@shapers/api-client";
import { getSupabaseClient } from "@/lib/supabase";
import { getCustomPublic, hasCustomApi } from "@/lib/customApi";
import { logoSource } from "@/lib/logo";

export default function PublicStoriesPage() {
  const { slug } = useParams<{ slug: string }>(); const [stories, setStories] = useState<PublicTestimony[] | null>(null); const [error, setError] = useState<string | null>(null);
  useEffect(() => { const load = hasCustomApi() ? getCustomPublic<PublicTestimony[]>(`/public/churches/${encodeURIComponent(slug)}/testimonies`) : getPublicTestimonies(getSupabaseClient(), slug); load.then(setStories).catch((err) => { setError(err instanceof Error ? err.message : "Unable to load stories."); setStories([]); }); }, [slug]);
  if (!stories) return <LoadingScreen logoSource={logoSource} />;
  return <Screen logoSource={logoSource}><Link href={`/new-here/${slug}`} style={{ color: theme.color.textMuted, marginBottom: theme.spacing(5) }}>← Back to welcome</Link><Text style={{ fontSize: 30, fontWeight: "700", marginBottom: 6 }}>Stories of Grace</Text><Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>A glimpse of what God is doing in our church family.</Text>{error ? <GlassCard><Text style={{ color: theme.color.danger }}>{error}</Text></GlassCard> : stories.length === 0 ? <GlassCard><Text>No stories have been shared publicly yet.</Text></GlassCard> : stories.map((story) => <GlassCard key={story.id} style={{ marginBottom: theme.spacing(3) }}><Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 6 }}>{story.title ?? "A story of grace"}</Text><Text style={{ color: theme.color.textMuted }}>{story.body}</Text></GlassCard>)}</Screen>;
}
