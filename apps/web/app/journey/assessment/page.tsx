"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { View } from "react-native";
import { Button, GlassCard, LoadingScreen, Text, theme } from "@shapers/ui";
import { getCurrentUser, getPurposeQuestions, savePurposeProfile } from "@shapers/api-client";
import type { PurposeAssessmentQuestion } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { AuthenticatedScreen } from "@/components/AuthenticatedScreen";

export default function PurposeAssessmentPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<PurposeAssessmentQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { getPurposeQuestions(getSupabaseClient()).then(setQuestions).catch((err) => { setError(err.message); setQuestions([]); }); }, []);
  async function submit() {
    if (!questions || Object.keys(answers).length !== questions.length) { setError("Please answer each question before continuing."); return; }
    setSaving(true); setError(null);
    try {
      const client = getSupabaseClient(); const me = await getCurrentUser(client);
      if (!me) throw new Error("Please sign in again to save your assessment.");
      const scores: Record<string, number> = {};
      questions.forEach((question) => question.options.find((option) => option.key === answers[question.id])?.weight && Object.entries(question.options.find((option) => option.key === answers[question.id])?.weight ?? {}).forEach(([gift, score]) => scores[gift] = (scores[gift] ?? 0) + score));
      const gifts = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([gift]) => gift);
      await savePurposeProfile(client, { church_id: me.person.church_id, person_id: me.person.id, gifts, marketplace_calling: null, raw_answers: answers });
      router.replace("/journey");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save your assessment."); } finally { setSaving(false); }
  }
  if (!questions) return <LoadingScreen logoSource={logoSource} />;
  return <AuthenticatedScreen logoSource={logoSource}>
    <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 6 }}>Gift & Purpose Assessment</Text>
    <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>There are no right answers. Choose what feels most true of you.</Text>
    {questions.length === 0 ? <GlassCard><Text>No assessment questions are available yet.</Text></GlassCard> : questions.map((question, index) => <GlassCard key={question.id} style={{ marginBottom: theme.spacing(3) }}>
      <Text style={{ color: theme.color.textMuted, marginBottom: 4 }}>Question {index + 1}</Text><Text style={{ fontSize: 17, fontWeight: "600", marginBottom: 10 }}>{question.question_text}</Text>
      {question.options.map((option) => <Text key={option.key} onPress={() => setAnswers({ ...answers, [question.id]: option.key })} style={{ padding: 10, borderRadius: theme.radius.sm, backgroundColor: answers[question.id] === option.key ? theme.glass.backgroundElevated : "transparent", marginBottom: 4 }}>{answers[question.id] === option.key ? "● " : "○ "}{option.text}</Text>)}
    </GlassCard>)}
    {error ? <Text style={{ color: theme.color.danger, marginBottom: 10 }}>{error}</Text> : null}
    {questions.length > 0 ? <Button title={saving ? "Saving…" : "See my results"} onPress={submit} disabled={saving} /> : null}
  </AuthenticatedScreen>;
}
