import { useState } from "react";
import { Link } from "expo-router";
import { Pressable } from "react-native";
import { Button, GlassCard, Screen, Text, TextField, theme } from "@shapers/ui";
import { logoSource } from "@/lib/logo";

type LocalPrayerRequest = { id: string; text: string; anonymous: boolean; status: "pending" | "approved" };
const starterRequests: LocalPrayerRequest[] = [{ id: "starter-1", text: "For courage and wisdom as I take my next step.", anonymous: false, status: "approved" }];

export default function PrayerScreen() {
  const [requestText, setRequestText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [requests, setRequests] = useState(starterRequests);
  const [submitted, setSubmitted] = useState(false);

  function onSubmit() {
    const text = requestText.trim();
    if (!text) return;
    setRequests((current) => [{ id: `${Date.now()}`, text, anonymous: isAnonymous, status: "pending" }, ...current]);
    setRequestText("");
    setIsAnonymous(false);
    setSubmitted(true);
  }

  return (
    <Screen logoSource={logoSource}>
      <Link href="/dashboard" style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>← Back to dashboard</Link>
      <Text style={{ color: theme.color.textMuted, letterSpacing: 2, fontSize: 11, fontWeight: "700" }}>CARE</Text>
      <Text style={{ fontSize: 30, fontWeight: "700", marginTop: theme.spacing(1), marginBottom: theme.spacing(2) }}>Prayer wall</Text>
      <Text style={{ color: theme.color.textMuted, lineHeight: 21, marginBottom: theme.spacing(6) }}>Share what is on your heart. Your local church can stand with you in prayer.</Text>
      <GlassCard style={{ marginBottom: theme.spacing(5) }}>
        <Text style={{ fontWeight: "700", marginBottom: theme.spacing(2) }}>Share a request</Text>
        <TextField label="Your request" value={requestText} onChangeText={setRequestText} multiline />
        <Pressable onPress={() => setIsAnonymous((value) => !value)} style={{ paddingVertical: theme.spacing(3) }}><Text style={{ color: isAnonymous ? theme.color.primary : theme.color.textMuted }}>{isAnonymous ? "☑" : "☐"} Submit anonymously</Text></Pressable>
        <Button title="Submit request" onPress={onSubmit} disabled={!requestText.trim()} />
        {submitted ? <Text style={{ color: theme.color.success, marginTop: theme.spacing(3) }}>Request saved locally and awaiting approval.</Text> : null}
      </GlassCard>
      <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: theme.spacing(3) }}>Community prayers</Text>
      {requests.map((request) => <GlassCard key={request.id} style={{ marginBottom: theme.spacing(3) }}><Text style={{ lineHeight: 21 }}>{request.text}</Text><Text style={{ color: theme.color.textMuted, marginTop: theme.spacing(2) }}>{request.status === "pending" ? "Awaiting approval" : request.anonymous ? "Anonymous" : "A church member"}</Text></GlassCard>)}
    </Screen>
  );
}
