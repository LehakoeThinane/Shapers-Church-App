import { useEffect, useState } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { Button, GlassCard, LoadingScreen, Screen, theme } from "@shapers/ui";
import {
  completeLesson,
  getCourseWithLessons,
  getLessonQuiz,
  getQuizQuestions,
  submitQuizAnswers,
} from "@shapers/api-client";
import type { CourseWithLessons, Quiz, QuizQuestionForTaking } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

export default function LessonScreen() {
  const { id: courseId, lessonId } = useLocalSearchParams<{ id: string; lessonId: string }>();

  const [data, setData] = useState<CourseWithLessons | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionForTaking[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; milestone: string | null } | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const client = getSupabaseClient();
      const courseData = await getCourseWithLessons(client, courseId);
      if (cancelled) return;
      setData(courseData);

      const lessonQuiz = await getLessonQuiz(client, lessonId);
      if (cancelled) return;
      setQuiz(lessonQuiz);
      if (lessonQuiz) {
        const qs = await getQuizQuestions(client, lessonQuiz.id);
        if (!cancelled) setQuestions(qs);
      }
    }
    load().catch((err) => setError(err instanceof Error ? err.message : "Something went wrong"));
    return () => {
      cancelled = true;
    };
  }, [courseId, lessonId]);

  const lesson = data?.lessons.find((l) => l.id === lessonId);
  const alreadyComplete = Boolean(lesson?.progress?.completed_at);

  async function onMarkComplete() {
    setError(null);
    setSubmitting(true);
    try {
      const milestone = await completeLesson(getSupabaseClient(), lessonId);
      setResult({ score: 0, passed: true, milestone });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmitQuiz() {
    if (!quiz) return;
    setError(null);
    setSubmitting(true);
    try {
      const client = getSupabaseClient();
      const score = await submitQuizAnswers(client, quiz.id, answers);
      // Always call complete_lesson — it's the source of truth on
      // whether the score actually clears passing_score (and still
      // records the attempt even when it doesn't); `passed` here is
      // just for which message to show.
      const milestone = await completeLesson(client, lessonId, score);
      setResult({ score, passed: score >= quiz.passing_score, milestone });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <Screen logoSource={logoSource}>
        <Text style={{ color: theme.color.danger }}>{error}</Text>
      </Screen>
    );
  }

  if (!data || !lesson) return <LoadingScreen logoSource={logoSource} />;

  return (
    <Screen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(6) }}>
        {lesson.title}
      </Text>

      {lesson.content_url ? (
        <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(4) }}>
          {lesson.content_url}
        </Text>
      ) : null}

      {result ? (
        result.passed ? (
          <GlassCard style={{ marginBottom: theme.spacing(4) }}>
            {quiz ? <Text style={{ fontWeight: "600" }}>Score: {result.score}%</Text> : null}
            <Text>Lesson complete.</Text>
            {result.milestone ? (
              <Text style={{ fontWeight: "700", marginTop: theme.spacing(2) }}>
                🎉 You&apos;ve unlocked: {result.milestone}
              </Text>
            ) : null}
          </GlassCard>
        ) : (
          <GlassCard style={{ marginBottom: theme.spacing(4) }}>
            <Text style={{ fontWeight: "600" }}>Score: {result.score}%</Text>
            <Text>Needs {quiz?.passing_score}% to pass — try again.</Text>
            <View style={{ marginTop: theme.spacing(3) }}>
              <Button
                title="Try again"
                variant="secondary"
                onPress={() => {
                  setResult(null);
                  setAnswers({});
                }}
              />
            </View>
          </GlassCard>
        )
      ) : quiz ? (
        questions ? (
          <View>
            {questions.map((q) => (
              <View key={q.id} style={{ marginBottom: theme.spacing(5) }}>
                <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>
                  {q.question_text}
                </Text>
                {q.options.map((opt) => (
                  <Text
                    key={opt.key}
                    onPress={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.key }))}
                    style={{
                      paddingVertical: 6,
                      color: answers[q.id] === opt.key ? theme.color.primary : theme.color.text,
                      fontWeight: answers[q.id] === opt.key ? "700" : "400",
                    }}
                  >
                    {answers[q.id] === opt.key ? "● " : "○ "}
                    {opt.text}
                  </Text>
                ))}
              </View>
            ))}
            <Button
              title="Submit quiz"
              onPress={onSubmitQuiz}
              loading={submitting}
              disabled={questions.some((q) => !answers[q.id])}
            />
          </View>
        ) : (
          <LoadingScreen logoSource={logoSource} />
        )
      ) : alreadyComplete ? (
        <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(4) }}>
          You&apos;ve already completed this lesson.
        </Text>
      ) : (
        <Button title="Mark complete" onPress={onMarkComplete} loading={submitting} />
      )}

      <View style={{ marginTop: theme.spacing(6) }}>
        <Link href={`/courses/${courseId}`}>Back to course</Link>
      </View>
    </Screen>
  );
}
