import type {
  Course,
  CourseWithLessons,
  PersonMilestone,
  Quiz,
  QuizAnswers,
  QuizQuestionForTaking,
} from "@shapers/types";
import type { ShapersClient } from "./client";

export type CourseType = "sermon_series" | "program";

// GET /courses?type=...
export async function getCourses(client: ShapersClient, type?: CourseType): Promise<Course[]> {
  let query = client.from("course").select("*").order("title");
  if (type) query = query.eq("course_type", type);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// GET /courses/:id — course + lessons, each flagged with the caller's
// own completion (RLS already scopes person_progress to self).
export async function getCourseWithLessons(
  client: ShapersClient,
  courseId: string
): Promise<CourseWithLessons | null> {
  const { data: course, error: courseError } = await client
    .from("course")
    .select("*")
    .eq("id", courseId)
    .maybeSingle();
  if (courseError) throw courseError;
  if (!course) return null;

  const { data: lessons, error: lessonsError } = await client
    .from("lesson")
    .select("*")
    .eq("course_id", courseId)
    .order("position");
  if (lessonsError) throw lessonsError;

  const { data: progress, error: progressError } = await client
    .from("person_progress")
    .select("*")
    .in("lesson_id", (lessons ?? []).map((l) => l.id));
  if (progressError) throw progressError;

  const progressByLesson = new Map((progress ?? []).map((p) => [p.lesson_id, p]));
  return {
    course,
    lessons: (lessons ?? []).map((lesson) => ({
      ...lesson,
      progress: progressByLesson.get(lesson.id) ?? null,
    })),
  };
}

// A lesson has at most one quiz — null if this lesson is just content.
export async function getLessonQuiz(client: ShapersClient, lessonId: string): Promise<Quiz | null> {
  const { data, error } = await client.from("quiz").select("*").eq("lesson_id", lessonId).maybeSingle();
  if (error) throw error;
  return data;
}

// Question text/options only — never the answer. See
// get_quiz_questions() in supabase/migrations/20260812150006_courses_functions.sql.
export async function getQuizQuestions(
  client: ShapersClient,
  quizId: string
): Promise<QuizQuestionForTaking[]> {
  const { data, error } = await client.rpc("get_quiz_questions", { p_quiz_id: quizId });
  if (error) throw error;
  return data ?? [];
}

// Graded server-side; returns a 0-100 score.
export async function submitQuizAnswers(
  client: ShapersClient,
  quizId: string,
  answers: QuizAnswers
): Promise<number> {
  const { data, error } = await client.rpc("submit_quiz_answers", {
    p_quiz_id: quizId,
    p_answers: answers,
  });
  if (error) throw error;
  return data ?? 0;
}

// POST /lessons/:id/complete { quiz_score? }
// Returns the milestone_type if completing this lesson finished the
// course and unlocked one, otherwise null.
export async function completeLesson(
  client: ShapersClient,
  lessonId: string,
  quizScore?: number
): Promise<string | null> {
  const { data, error } = await client.rpc("complete_lesson", {
    p_lesson_id: lessonId,
    p_quiz_score: quizScore ?? null,
  });
  if (error) throw error;
  return data;
}

// GET /people/:id/milestones — self only here (RLS also allows a
// guardian to query their household's minors by passing that person's id).
export async function getMilestones(client: ShapersClient, personId: string): Promise<PersonMilestone[]> {
  const { data, error } = await client
    .from("person_milestone")
    .select("*")
    .eq("person_id", personId)
    .order("achieved_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
