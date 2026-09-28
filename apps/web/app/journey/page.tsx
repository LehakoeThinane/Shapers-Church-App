"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { View } from "react-native";
import { GlassCard, LoadingScreen, Text, theme } from "@shapers/ui";
import { getCourseWithLessons, getGrowthTrack, getMyPurposeProfile } from "@shapers/api-client";
import type { Course, PersonPurposeProfile } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { AuthenticatedScreen } from "@/components/AuthenticatedScreen";

type Stage = { course: Course; complete: number; total: number };

export default function JourneyPage() {
  const [stages, setStages] = useState<Stage[] | null>(null);
  const [profile, setProfile] = useState<PersonPurposeProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const client = getSupabaseClient();
    Promise.all([getGrowthTrack(client), getMyPurposeProfile(client)])
      .then(async ([courses, purposeProfile]) => {
        const results = await Promise.all(courses.map((course) => getCourseWithLessons(client, course.id)));
        if (cancelled) return;
        setProfile(purposeProfile);
        setStages(results.flatMap((result) => result ? [{
          course: result.course,
          complete: result.lessons.filter((lesson) => lesson.progress?.completed_at).length,
          total: result.lessons.length,
        }] : []));
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Unable to load your journey."));
    return () => { cancelled = true; };
  }, []);

  if (!stages) return <LoadingScreen logoSource={logoSource} />;
  if (error) return <AuthenticatedScreen logoSource={logoSource}><Text style={{ color: theme.color.danger }}>{error}</Text></AuthenticatedScreen>;

  const labels = ["Purpose", "Pursuit", "Partner", "Produce"];
  return (
    <AuthenticatedScreen logoSource={logoSource}>
      <Text style={{ fontSize: 30, fontWeight: "700", marginBottom: theme.spacing(2) }}>Your Purpose Journey</Text>
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>A steady path from discovering Jesus to making an impact.</Text>
      {stages.length === 0 ? <GlassCard><Text>No journey stages have been published yet.</Text></GlassCard> : stages.map((stage, index) => {
        const percent = stage.total ? Math.round((stage.complete / stage.total) * 100) : 0;
        const previousStage = index > 0 ? stages[index - 1] ?? null : null;
        const locked = previousStage !== null && previousStage.complete < previousStage.total;
        return <View key={stage.course.id} style={{ flexDirection: "row", gap: theme.spacing(3), marginBottom: theme.spacing(3) }}>
          <View style={{ width: 32, alignItems: "center" }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: percent === 100 ? theme.color.success : theme.glass.backgroundElevated, alignItems: "center", justifyContent: "center" }}><Text>{percent === 100 ? "✓" : index + 1}</Text></View>
            {index < stages.length - 1 ? <View style={{ width: 1, flex: 1, backgroundColor: theme.color.border, marginTop: 6 }} /> : null}
          </View>
          <GlassCard style={{ flex: 1, opacity: locked ? 0.5 : 1 }}>
            <Text style={{ color: theme.color.textMuted, fontSize: 12, textTransform: "uppercase", marginBottom: 4 }}>{labels[index] ?? "Stage"}</Text>
            <Text style={{ fontSize: 19, fontWeight: "700", marginBottom: 6 }}>{stage.course.title}</Text>
            <Text style={{ color: theme.color.textMuted, marginBottom: 10 }}>{locked ? "Complete the previous stage to unlock." : `${stage.complete} of ${stage.total} sessions complete`}</Text>
            {!locked ? <Link href={`/courses/${stage.course.id}`} style={{ color: theme.color.primary }}>Continue journey →</Link> : null}
          </GlassCard>
        </View>;
      })}
      <GlassCard style={{ marginTop: theme.spacing(3) }}>
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 6 }}>Discover your gifts</Text>
        <Text style={{ color: theme.color.textMuted, marginBottom: 10 }}>{profile ? `Your gifts: ${profile.gifts.join(", ") || "saved"}.` : "Take the short assessment to help shape your Produce stage."}</Text>
        <Link href="/journey/assessment" style={{ color: theme.color.primary }}>{profile ? "View assessment" : "Start assessment"} →</Link>
      </GlassCard>
    </AuthenticatedScreen>
  );
}
