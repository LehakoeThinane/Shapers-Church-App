import type { Course, PersonPurposeProfile, PurposeAssessmentQuestion, Sermon } from "@shapers/types";
import type { ShapersClient } from "./client";

export async function getGrowthTrack(client: ShapersClient): Promise<Course[]> {
  const { data, error } = await client
    .from("course")
    .select("*")
    .eq("course_type", "growth_track")
    .order("position");
  if (error) throw error;
  return data ?? [];
}

export async function getSermons(client: ShapersClient): Promise<Sermon[]> {
  const { data, error } = await client.from("sermon").select("*").order("published_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface CreateSermonInput {
  churchId: string;
  title: string;
  speakerName: string;
  scriptureReference?: string;
  videoUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  publishNow: boolean;
}

export async function createSermon(client: ShapersClient, input: CreateSermonInput): Promise<Sermon> {
  if (!input.videoUrl && !input.audioUrl) throw new Error("Provide a video or audio URL before publishing a sermon.");
  const { data, error } = await client.from("sermon").insert({
    church_id: input.churchId,
    title: input.title.trim(),
    speaker_name: input.speakerName.trim(),
    scripture_reference: input.scriptureReference?.trim() || null,
    video_url: input.videoUrl?.trim() || null,
    audio_url: input.audioUrl?.trim() || null,
    thumbnail_url: input.thumbnailUrl?.trim() || null,
    duration_seconds: input.durationSeconds ?? null,
    published_at: input.publishNow ? new Date().toISOString() : null,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function getPurposeQuestions(client: ShapersClient): Promise<PurposeAssessmentQuestion[]> {
  const { data, error } = await client.from("purpose_assessment_question").select("*").order("position");
  if (error) throw error;
  return data ?? [];
}

export async function getMyPurposeProfile(client: ShapersClient): Promise<PersonPurposeProfile | null> {
  const { data, error } = await client.from("person_purpose_profile").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export async function savePurposeProfile(
  client: ShapersClient,
  profile: Pick<PersonPurposeProfile, "church_id" | "person_id" | "gifts" | "marketplace_calling" | "raw_answers">
): Promise<PersonPurposeProfile> {
  const { data, error } = await client
    .from("person_purpose_profile")
    .upsert(profile, { onConflict: "person_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createGrowthTrackStage(client: ShapersClient, input: { title: string; position: number; firstLessonTitle: string; firstLessonUrl?: string }): Promise<string> {
  const { data, error } = await client.rpc("create_growth_track_stage", { p_title: input.title, p_position: input.position, p_first_lesson_title: input.firstLessonTitle, p_first_lesson_url: input.firstLessonUrl ?? null });
  if (error) throw error;
  return data;
}

export async function addGrowthTrackLesson(client: ShapersClient, input: { courseId: string; title: string; contentUrl?: string }): Promise<string> {
  const { data, error } = await client.rpc("add_growth_track_lesson", { p_course_id: input.courseId, p_title: input.title, p_content_url: input.contentUrl ?? null });
  if (error) throw error;
  return data;
}

export async function createPurposeQuestion(client: ShapersClient, input: {
  churchId: string;
  questionText: string;
  category: "spiritual_gift" | "natural_strength" | "marketplace_interest";
  options: { key: string; text: string; weight: Record<string, number> }[];
}): Promise<PurposeAssessmentQuestion> {
  if (input.options.length < 2 || input.options.some((option) => !option.text.trim() || Object.keys(option.weight).length === 0)) {
    throw new Error("Each question needs at least two complete, weighted options.");
  }
  const { data: last, error: lastError } = await client.from("purpose_assessment_question").select("position").eq("church_id", input.churchId).order("position", { ascending: false }).limit(1);
  if (lastError) throw lastError;
  const { data, error } = await client.from("purpose_assessment_question").insert({ church_id: input.churchId, question_text: input.questionText.trim(), category: input.category, options: input.options, position: (last?.[0]?.position ?? 0) + 1 }).select().single();
  if (error) throw error;
  return data;
}
