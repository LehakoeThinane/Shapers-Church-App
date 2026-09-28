"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, GlassCard, LoadingScreen, Text, TextField, theme } from "@shapers/ui";
import { createSermon, getCurrentUser, getSermons } from "@shapers/api-client";
import type { CurrentUser, Sermon } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { AuthenticatedScreen } from "@/components/AuthenticatedScreen";

export default function AdminSermonsPage() {
  const router = useRouter(); const [me, setMe] = useState<CurrentUser | null>(null); const [sermons, setSermons] = useState<Sermon[] | null>(null); const [title, setTitle] = useState(""); const [speaker, setSpeaker] = useState(""); const [scripture, setScripture] = useState(""); const [videoUrl, setVideoUrl] = useState(""); const [audioUrl, setAudioUrl] = useState(""); const [publish, setPublish] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);
  async function load() { const client = getSupabaseClient(); const user = await getCurrentUser(client); if (!user) { router.replace("/onboarding/match"); return; } if (!user.roleAssignments.some((role) => role.role === "admin")) { router.replace("/dashboard"); return; } const items = await getSermons(client); setMe(user); setSermons(items); }
  useEffect(() => { void load().catch((err) => setError(err instanceof Error ? err.message : "Unable to load sermons.")).finally(() => setSermons((current) => current ?? [])); }, []);
  async function submit() { if (!me) return; setSaving(true); setError(null); try { await createSermon(getSupabaseClient(), { churchId: me.person.church_id, title, speakerName: speaker, scriptureReference: scripture, videoUrl, audioUrl, publishNow: publish }); setTitle(""); setSpeaker(""); setScripture(""); setVideoUrl(""); setAudioUrl(""); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Unable to save sermon."); } finally { setSaving(false); } }
  if (!sermons || !me) return <LoadingScreen logoSource={logoSource} />;
  return <AuthenticatedScreen logoSource={logoSource}><Link href="/admin" style={{ color: theme.color.textMuted, display: "block", marginBottom: theme.spacing(4) }}>← Back to admin</Link><Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 6 }}>Sermon library</Text><Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>Publish a sermon with a hosted video or audio link.</Text><GlassCard style={{ marginBottom: theme.spacing(6) }}><TextField label="Sermon title" value={title} onChangeText={setTitle} /><TextField label="Speaker" value={speaker} onChangeText={setSpeaker} /><TextField label="Scripture reference" value={scripture} onChangeText={setScripture} /><TextField label="Video URL" value={videoUrl} onChangeText={setVideoUrl} /><TextField label="Audio URL" value={audioUrl} onChangeText={setAudioUrl} /><Text onPress={() => setPublish((value) => !value)} style={{ color: publish ? theme.color.primary : theme.color.textMuted, marginBottom: 12 }}>{publish ? "☑" : "☐"} Publish immediately</Text>{error ? <Text style={{ color: theme.color.danger, marginBottom: 10 }}>{error}</Text> : null}<Button title={publish ? "Publish sermon" : "Save draft"} loading={saving} disabled={!title.trim() || !speaker.trim() || (!videoUrl.trim() && !audioUrl.trim())} onPress={submit} /></GlassCard><Text style={{ fontWeight: "700", marginBottom: 8 }}>Your sermons</Text>{sermons.length === 0 ? <Text style={{ color: theme.color.textMuted }}>No sermons have been added yet.</Text> : sermons.map((sermon) => <GlassCard key={sermon.id} style={{ marginBottom: 8 }}><Text style={{ fontWeight: "700" }}>{sermon.title}</Text><Text style={{ color: theme.color.textMuted }}>{sermon.published_at ? "Published" : "Draft"} · {sermon.speaker_name}</Text></GlassCard>)}</AuthenticatedScreen>;
}
