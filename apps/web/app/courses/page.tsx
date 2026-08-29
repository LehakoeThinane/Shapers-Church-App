"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { View } from "react-native";
import { GlassCard, LoadingScreen, Text, theme } from "@shapers/ui";
import { getCourses } from "@shapers/api-client";
import type { Course } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { AuthenticatedScreen } from "@/components/AuthenticatedScreen";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCourses(getSupabaseClient())
      .then((result) => {
        if (!cancelled) setCourses(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <AuthenticatedScreen logoSource={logoSource}>
        <Text style={{ color: theme.color.danger }}>{error}</Text>
      </AuthenticatedScreen>
    );
  }

  if (!courses) return <LoadingScreen logoSource={logoSource} />;

  const seriesCourses = courses.filter((c) => c.course_type === "sermon_series");
  const programCourses = courses.filter((c) => c.course_type === "program");

  return (
    <AuthenticatedScreen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(6) }}>Courses</Text>

      {courses.length === 0 ? (
        <Text style={{ color: theme.color.textMuted }}>No courses published yet.</Text>
      ) : (
        <>
          {programCourses.length > 0 ? (
            <View style={{ marginBottom: theme.spacing(4) }}>
              <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>Programs</Text>
              <GlassCard>
                {programCourses.map((c) => (
                  <Link
                    key={c.id}
                    href={`/courses/${c.id}`}
                    style={{ display: "block", paddingTop: 6, paddingBottom: 6 }}
                  >
                    {c.title}
                    {c.unlocks_milestone ? ` (unlocks ${c.unlocks_milestone})` : ""}
                  </Link>
                ))}
              </GlassCard>
            </View>
          ) : null}

          {seriesCourses.length > 0 ? (
            <View style={{ marginBottom: theme.spacing(4) }}>
              <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>Sermon series</Text>
              <GlassCard>
                {seriesCourses.map((c) => (
                  <Link
                    key={c.id}
                    href={`/courses/${c.id}`}
                    style={{ display: "block", paddingTop: 6, paddingBottom: 6 }}
                  >
                    {c.title}
                  </Link>
                ))}
              </GlassCard>
            </View>
          ) : null}
        </>
      )}
    </AuthenticatedScreen>
  );
}
