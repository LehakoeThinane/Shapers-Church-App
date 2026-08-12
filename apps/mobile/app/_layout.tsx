import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)/signup" />
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="onboarding/join" />
      <Stack.Screen name="onboarding/match" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="checkin/index" />
      <Stack.Screen name="checkin/scan" />
      <Stack.Screen name="checkin/pickup" />
      <Stack.Screen name="groups/index" />
      <Stack.Screen name="groups/[id]/index" />
      <Stack.Screen name="groups/[id]/reports" />
      <Stack.Screen name="groups/[id]/meetings/[meetingId]" />
      <Stack.Screen name="courses/index" />
      <Stack.Screen name="courses/[id]/index" />
      <Stack.Screen name="courses/[id]/lessons/[lessonId]" />
      <Stack.Screen name="announcements/index" />
      <Stack.Screen name="events/index" />
      <Stack.Screen name="prayer/index" />
    </Stack>
  );
}
