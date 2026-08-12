import { useEffect, useState } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { LoadingScreen, Screen, theme } from "@shapers/ui";
import { getCourseWithLessons } from "@shapers/api-client";
import type { CourseWithLessons } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

export default function CourseDetailScreen() {
  const { id: courseId } = useLocalSearchParams<{ id: string }>();

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
      <Screen logoSource={logoSource}>
        <Text style={{ color: theme.color.danger }}>{error}</Text>
      </Screen>
    );
  }

  if (!data) return <LoadingScreen logoSource={logoSource} />;

  const { course, lessons } = data;
  const completedCount = lessons.filter((l) => l.progress?.completed_at).length;

  return (
    <Screen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>{course.title}</Text>
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>
        {completedCount}/{lessons.length} lessons complete
        {course.unlocks_milestone ? ` · unlocks ${course.unlocks_milestone}` : ""}
      </Text>

      {lessons.length === 0 ? (
        <Text style={{ color: theme.color.textMuted }}>No lessons yet.</Text>
      ) : (
        lessons.map((lesson) => (
          <Link
            key={lesson.id}
            href={`/courses/${course.id}/lessons/${lesson.id}`}
            style={{ paddingVertical: 8 }}
          >
            {lesson.progress?.completed_at ? "✓ " : ""}
            {lesson.position}. {lesson.title}
          </Link>
        ))
      )}

      <View style={{ marginTop: theme.spacing(6) }}>
        <Link href="/courses">Back to courses</Link>
      </View>
    </Screen>
  );
}
