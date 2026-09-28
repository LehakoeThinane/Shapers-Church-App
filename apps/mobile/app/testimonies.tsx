import { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, LoadingScreen, Screen, Text, TextField, theme } from "@shapers/ui";
import { approveTestimony, getCurrentUser, getTestimonies, submitTestimony } from "@shapers/api-client";
import type { CurrentUser, Testimony } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

export default function TestimoniesScreen() {
  const [me, setMe] = useState<CurrentUser | null>(null); const [stories, setStories] = useState<Testimony[] | null>(null);
  const [body, setBody] = useState(""); const [anonymous, setAnonymous] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  async function load() { const client = getSupabaseClient(); const [user, testimonies] = await Promise.all([getCurrentUser(client), getTestimonies(client)]); setMe(user); setStories(testimonies); }
  useEffect(() => { void load().catch((err) => setError(err instanceof Error ? err.message : "Unable to load testimonies.")); }, []);
  async function submit() { if (!me) return; setBusy(true); setError(null); try { await submitTestimony(getSupabaseClient(), { church_id: me.person.church_id, submitted_by: me.person.id, title: null, body, media_url: null, is_anonymous: anonymous }); setBody(""); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Unable to submit your testimony."); } finally { setBusy(false); } }
  if (!me || !stories) return <LoadingScreen logoSource={logoSource} />;
  const admin = me.roleAssignments.some((role) => role.role === "admin"); const pending = stories.filter((story) => !story.is_approved); const approved = stories.filter((story) => story.is_approved);
  return <Screen logoSource={logoSource}><Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 6 }}>Stories of Grace</Text><Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>Celebrate what God is doing among us.</Text>
    <TextField label="Share your testimony" value={body} onChangeText={setBody} multiline /><Text onPress={() => setAnonymous((value) => !value)} style={{ color: anonymous ? theme.color.primary : theme.color.textMuted, marginBottom: 12 }}>{anonymous ? "☑" : "☐"} Share anonymously</Text><Button title="Submit for review" disabled={!body.trim()} loading={busy} onPress={submit} />
    {error ? <Text style={{ color: theme.color.danger, marginTop: 10 }}>{error}</Text> : null}
    {admin && pending.length > 0 ? <View style={{ marginTop: theme.spacing(7) }}><Text style={{ fontWeight: "700", marginBottom: 8 }}>Awaiting review</Text>{pending.map((story) => <View key={story.id} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.color.border }}><Text style={{ marginBottom: 8 }}>{story.body}</Text><Button title="Approve" variant="secondary" loading={busy} onPress={async () => { setBusy(true); setError(null); try { await approveTestimony(getSupabaseClient(), story.id); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Unable to approve testimony."); } finally { setBusy(false); } }} /></View>)}</View> : null}
    <View style={{ marginTop: theme.spacing(7) }}><Text style={{ fontWeight: "700", marginBottom: 8 }}>Testimony wall</Text>{approved.map((story) => <View key={story.id} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.color.border }}><Text style={{ fontWeight: "600", marginBottom: 4 }}>{story.title ?? "A story of grace"}</Text><Text style={{ color: theme.color.textMuted }}>{story.body}</Text></View>)}</View>
  </Screen>;
}
