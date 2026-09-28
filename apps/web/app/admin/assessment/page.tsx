"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, GlassCard, LoadingScreen, Text, TextField, theme } from "@shapers/ui";
import { createPurposeQuestion, getCurrentUser, getPurposeQuestions } from "@shapers/api-client";
import type { CurrentUser, PurposeAssessmentQuestion } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { AuthenticatedScreen } from "@/components/AuthenticatedScreen";

type Category = "spiritual_gift" | "natural_strength" | "marketplace_interest";
function weights(value: string): Record<string, number> { return Object.fromEntries(value.split(",").map((gift) => gift.trim().toLowerCase()).filter(Boolean).map((gift) => [gift, 1])); }

export default function AssessmentAdminPage() {
  const router = useRouter(); const [me, setMe] = useState<CurrentUser | null>(null); const [questions, setQuestions] = useState<PurposeAssessmentQuestion[] | null>(null); const [question, setQuestion] = useState(""); const [category, setCategory] = useState<Category>("spiritual_gift"); const [options, setOptions] = useState(["", "", ""]); const [gifts, setGifts] = useState(["", "", ""]); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);
  async function load() { const client = getSupabaseClient(); const user = await getCurrentUser(client); if (!user) { router.replace("/onboarding/match"); return; } if (!user.roleAssignments.some((role) => role.role === "admin")) { router.replace("/dashboard"); return; } const items = await getPurposeQuestions(client); setMe(user); setQuestions(items); }
  useEffect(() => { void load().catch((err) => setError(err instanceof Error ? err.message : "Unable to load assessment questions.")).finally(() => setQuestions((value) => value ?? [])); }, []);
  async function submit() { if (!me) return; setSaving(true); setError(null); try { await createPurposeQuestion(getSupabaseClient(), { churchId: me.person.church_id, questionText: question, category, options: options.map((text, index) => ({ key: String.fromCharCode(97 + index), text, weight: weights(gifts[index] ?? "") })) }); setQuestion(""); setOptions(["", "", ""]); setGifts(["", "", ""]); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Unable to save question."); } finally { setSaving(false); } }
  if (!questions || !me) return <LoadingScreen logoSource={logoSource} />;
  const complete = Boolean(question.trim()) && options.every((option, index) => Boolean(option.trim()) && Object.keys(weights(gifts[index] ?? "")).length !== 0);
  return <AuthenticatedScreen logoSource={logoSource}><Link href="/admin" style={{ color: theme.color.textMuted, display: "block", marginBottom: theme.spacing(4) }}>← Back to admin</Link><Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 6 }}>Purpose assessment</Text><Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>Create questions that map answers to gift keys.</Text><GlassCard style={{ marginBottom: theme.spacing(6) }}><TextField label="Question" value={question} onChangeText={setQuestion} />{(["spiritual_gift", "natural_strength", "marketplace_interest"] as Category[]).map((value) => <Text key={value} onPress={() => setCategory(value)} style={{ color: category === value ? theme.color.primary : theme.color.textMuted, paddingVertical: 4 }}>{category === value ? "● " : "○ "}{value.replaceAll("_", " ")}</Text>)}{options.map((option, index) => <GlassCard key={index} style={{ marginTop: 10 }}><TextField label={`Option ${index + 1}`} value={option} onChangeText={(value) => setOptions(options.map((item, itemIndex) => itemIndex === index ? value : item))} /><TextField label="Gift keys, comma-separated" value={gifts[index] ?? ""} onChangeText={(value) => setGifts(gifts.map((item, itemIndex) => itemIndex === index ? value : item))} placeholder="teaching, leadership" /></GlassCard>)}{error ? <Text style={{ color: theme.color.danger, marginTop: 10 }}>{error}</Text> : null}<Button title="Add question" loading={saving} disabled={!complete} onPress={submit} /></GlassCard><Text style={{ fontWeight: "700", marginBottom: 8 }}>Current questions</Text>{questions.length === 0 ? <Text style={{ color: theme.color.textMuted }}>No questions have been added yet.</Text> : questions.map((item) => <GlassCard key={item.id} style={{ marginBottom: 8 }}><Text style={{ fontWeight: "700", marginBottom: 4 }}>{item.question_text}</Text><Text style={{ color: theme.color.textMuted }}>{item.options.map((option) => option.text).join(" · ")}</Text></GlassCard>)}</AuthenticatedScreen>;
}
