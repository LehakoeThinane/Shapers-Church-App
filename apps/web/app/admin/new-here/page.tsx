"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, GlassCard, LoadingScreen, Text, TextField, theme } from "@shapers/ui";
import { getChurchPublicContent, getCurrentUser, saveChurchPublicContent, saveChurchSlug, type PublicContentValues } from "@shapers/api-client";
import type { CurrentUser } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { AuthenticatedScreen } from "@/components/AuthenticatedScreen";

const blankContent: PublicContentValues = { mission_statement: "", what_to_expect: "", beliefs: "" };

export default function AdminNewHerePage() {
  const router = useRouter(); const [me, setMe] = useState<CurrentUser | null>(null); const [slug, setSlug] = useState(""); const [content, setContent] = useState<PublicContentValues>(blankContent); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null); const [saved, setSaved] = useState(false);
  useEffect(() => {
    let cancelled = false; const client = getSupabaseClient();
    async function load() {
      const user = await getCurrentUser(client); if (!user) { router.replace("/onboarding/match"); return; }
      if (!user.roleAssignments.some((role) => role.role === "admin")) { router.replace("/dashboard"); return; }
      const [{ data: church, error: churchError }, values] = await Promise.all([client.from("church").select("slug").eq("id", user.person.church_id).single(), getChurchPublicContent(client, user.person.church_id)]);
      if (churchError) throw churchError; if (cancelled) return; setMe(user); setSlug(church.slug ?? ""); setContent(values);
    }
    void load().catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Unable to load public content.")).finally(() => !cancelled && setLoading(false)); return () => { cancelled = true; };
  }, [router]);
  async function save() { if (!me) return; setSaving(true); setSaved(false); setError(null); try { const client = getSupabaseClient(); await saveChurchSlug(client, me.person.church_id, slug); await saveChurchPublicContent(client, me.person.church_id, content); setSaved(true); } catch (err) { setError(err instanceof Error ? err.message : "Unable to save public content."); } finally { setSaving(false); } }
  if (loading) return <LoadingScreen logoSource={logoSource} />;
  if (!me) return <AuthenticatedScreen logoSource={logoSource}><Text style={{ color: theme.color.danger }}>{error ?? "Unable to verify admin access."}</Text></AuthenticatedScreen>;
  return <AuthenticatedScreen logoSource={logoSource}><Link href="/admin" style={{ color: theme.color.textMuted, display: "block", marginBottom: theme.spacing(4) }}>← Back to admin</Link><Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 6 }}>New Here content</Text><Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>This copy appears on your public welcome page.</Text>
    <GlassCard style={{ marginBottom: theme.spacing(4) }}><TextField label="Public church slug" value={slug} onChangeText={setSlug} placeholder="shapers" /><Text style={{ color: theme.color.textMuted, fontSize: 12 }}>Public address: /new-here/{slug.trim().toLowerCase() || "your-church"}</Text></GlassCard>
    <GlassCard style={{ marginBottom: theme.spacing(4) }}><TextField label="Mission statement" value={content.mission_statement} onChangeText={(value) => setContent({ ...content, mission_statement: value })} multiline /><TextField label="What to expect" value={content.what_to_expect} onChangeText={(value) => setContent({ ...content, what_to_expect: value })} multiline /><TextField label="Beliefs" value={content.beliefs} onChangeText={(value) => setContent({ ...content, beliefs: value })} multiline /></GlassCard>
    {error ? <Text style={{ color: theme.color.danger, marginBottom: 10 }}>{error}</Text> : null}{saved ? <Text style={{ color: theme.color.success, marginBottom: 10 }}>Saved. Your public page is updated.</Text> : null}<Button title="Save public content" loading={saving} onPress={save} />
  </AuthenticatedScreen>;
}
