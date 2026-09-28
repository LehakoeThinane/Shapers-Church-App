import { useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { Button, GlassCard, Screen, Text, theme } from "@shapers/ui";
import { logoSource } from "@/lib/logo";

const questions = [
  { prompt: "When people need help, I naturally…", options: ["Listen and encourage", "Organise a practical response", "Teach what I have learned"] },
  { prompt: "I feel most energised when I am…", options: ["Creating something", "Bringing people together", "Serving behind the scenes"] },
  { prompt: "The change I want to see is…", options: ["People finding hope", "Communities becoming stronger", "Ideas becoming action"] },
];

export default function PurposeAssessmentScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [complete, setComplete] = useState(false);
  const question = questions[index];
  const selected = answers[index];
  function choose(option: string) { setAnswers((current) => { const next = [...current]; next[index] = option; return next; }); }
  function continueAssessment() { if (!selected) return; if (index === questions.length - 1) setComplete(true); else setIndex((current) => current + 1); }

  return (
    <Screen logoSource={logoSource}>
      <Pressable onPress={() => router.back()} style={{ marginBottom: theme.spacing(6) }}><Text style={{ color: theme.color.textMuted }}>← Back</Text></Pressable>
      {complete ? <>
        <Text style={{ color: theme.color.textMuted, letterSpacing: 2, fontSize: 11, fontWeight: "700" }}>YOUR RESULT</Text>
        <Text style={{ fontSize: 30, fontWeight: "700", marginTop: theme.spacing(1), marginBottom: theme.spacing(3) }}>You are wired to shape.</Text>
        <GlassCard variant="elevated" style={{ marginBottom: theme.spacing(5) }}><Text style={{ lineHeight: 22 }}>Your answers point to a blend of encouragement, connection, and practical action. Keep noticing where people come alive around you.</Text></GlassCard>
        <Button title="Return to journey" onPress={() => router.replace("/journey")} />
      </> : <>
        <Text style={{ color: theme.color.textMuted, letterSpacing: 2, fontSize: 11, fontWeight: "700" }}>DISCOVER YOUR GIFTS</Text>
        <Text style={{ fontSize: 30, fontWeight: "700", marginTop: theme.spacing(1), marginBottom: theme.spacing(2) }}>A quick reflection</Text>
        <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>Question {index + 1} of {questions.length}</Text>
        <GlassCard><Text style={{ fontSize: 20, fontWeight: "700", lineHeight: 27, marginBottom: theme.spacing(4) }}>{question.prompt}</Text>{question.options.map((option) => <Pressable key={option} onPress={() => choose(option)} style={{ paddingVertical: theme.spacing(2) }}><Text style={{ color: selected === option ? theme.color.primary : theme.color.textMuted, fontWeight: selected === option ? "700" : "400" }}>{selected === option ? "● " : "○ "}{option}</Text></Pressable>)}</GlassCard>
        <View style={{ marginTop: theme.spacing(5) }}><Button title={index === questions.length - 1 ? "See my result" : "Continue"} onPress={continueAssessment} disabled={!selected} /></View>
      </>}
    </Screen>
  );
}
