"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { View } from "react-native";
import { GlassCard, LoadingScreen, Text, theme } from "@shapers/ui";
import { getCourseWithLessons } from "@shapers/api-client";
import type { CourseWithLessons } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { AuthenticatedScreen } from "@/components/AuthenticatedScreen";

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;

  const [data, setData] = useState<CourseWithLessons | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCourseWithLessons(getSupabaseClient(), courseId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (error) {
    return (
      <AuthenticatedScreen logoSource={logoSource}>
        <Text style={{ color: theme.color.danger }}>{error}</Text>
      </AuthenticatedScreen>
    );
  }

  if (!data) return <LoadingScreen logoSource={logoSource} />;

  const { course, lessons } = data;
  const completedCount = lessons.filter((l) => l.progress?.completed_at).length;

  return (
    <AuthenticatedScreen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>{course.title}</Text>
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>
        {completedCount}/{lessons.length} lessons complete
        {course.unlocks_milestone ? ` · unlocks ${course.unlocks_milestone}` : ""}
      </Text>

      {lessons.length === 0 ? (
        <Text style={{ color: theme.color.textMuted }}>No lessons yet.</Text>
      ) : (
        <GlassCard style={{ marginBottom: theme.spacing(4) }}>
          {lessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/courses/${course.id}/lessons/${lesson.id}`}
              style={{ display: "block", paddingTop: 8, paddingBottom: 8 }}
            >
              {lesson.progress?.completed_at ? "✓ " : ""}
              {lesson.position}. {lesson.title}
            </Link>
          ))}
        </GlassCard>
      )}

      <View>
        <Link href="/courses">Back to courses</Link>
      </View>
    </AuthenticatedScreen>
  );
}
