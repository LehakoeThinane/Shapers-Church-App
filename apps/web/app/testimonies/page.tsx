"use client";

import { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, GlassCard, LoadingScreen, Text, TextField, theme } from "@shapers/ui";
import { approveTestimony, getCurrentUser, getTestimonies, submitTestimony } from "@shapers/api-client";
import type { CurrentUser, Testimony } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { AuthenticatedScreen } from "@/components/AuthenticatedScreen";

export default function TestimoniesPage() {
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [testimonies, setTestimonies] = useState<Testimony[] | null>(null);
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null); const [saving, setSaving] = useState(false);
  async function load() { const client = getSupabaseClient(); const [user, entries] = await Promise.all([getCurrentUser(client), getTestimonies(client)]); setMe(user); setTestimonies(entries); }
  useEffect(() => { void load().catch((err) => setError(err instanceof Error ? err.message : "Unable to load testimonies.")); }, []);
  async function submit() { if (!me) return; setSaving(true); setError(null); try { await submitTestimony(getSupabaseClient(), { church_id: me.person.church_id, submitted_by: me.person.id, title: title.trim() || null, body: body.trim(), media_url: null, is_anonymous: anonymous }); setTitle(""); setBody(""); setAnonymous(false); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Unable to submit your testimony."); } finally { setSaving(false); } }
  async function approve(id: string) { setSaving(true); try { await approveTestimony(getSupabaseClient(), id); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Unable to approve testimony."); } finally { setSaving(false); } }
  if (!me || !testimonies) return <LoadingScreen logoSource={logoSource} />;
  const isAdmin = me.roleAssignments.some((role) => role.role === "admin"); const pending = testimonies.filter((item) => !item.is_approved); const approved = testimonies.filter((item) => item.is_approved);
  return <AuthenticatedScreen logoSource={logoSource}>
    <Text style={{ fontSize: 30, fontWeight: "700", marginBottom: 6 }}>Stories of Grace</Text><Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>Celebrate what God is doing in our church family.</Text>
    <GlassCard style={{ marginBottom: theme.spacing(6) }}><Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>Share your testimony</Text><TextField label="Title (optional)" value={title} onChangeText={setTitle} /><TextField label="Your story" value={body} onChangeText={setBody} multiline /><Text onPress={() => setAnonymous((value) => !value)} style={{ color: anonymous ? theme.color.primary : theme.color.textMuted, marginBottom: 12 }}>{anonymous ? "☑" : "☐"} Share anonymously</Text><Button title="Submit for review" loading={saving} disabled={!body.trim()} onPress={submit} /></GlassCard>
    {error ? <Text style={{ color: theme.color.danger, marginBottom: 12 }}>{error}</Text> : null}
    {isAdmin && pending.length > 0 ? <View style={{ marginBottom: theme.spacing(6) }}><Text style={{ fontWeight: "700", marginBottom: 8 }}>Awaiting review ({pending.length})</Text>{pending.map((item) => <GlassCard key={item.id} style={{ marginBottom: 8 }}><Text style={{ fontWeight: "700", marginBottom: 4 }}>{item.title ?? "Untitled testimony"}</Text><Text style={{ color: theme.color.textMuted, marginBottom: 10 }}>{item.body}</Text><Button title="Approve" variant="secondary" loading={saving} onPress={() => approve(item.id)} /></GlassCard>)}</View> : null}
    <Text style={{ fontWeight: "700", marginBottom: 8 }}>Testimony wall</Text>{approved.length === 0 ? <Text style={{ color: theme.color.textMuted }}>No stories have been shared yet.</Text> : approved.map((item) => <GlassCard key={item.id} style={{ marginBottom: 8 }}><Text style={{ fontSize: 17, fontWeight: "700", marginBottom: 4 }}>{item.title ?? "A story of grace"}</Text><Text style={{ color: theme.color.textMuted }}>{item.body}</Text></GlassCard>)}
  </AuthenticatedScreen>;
}
