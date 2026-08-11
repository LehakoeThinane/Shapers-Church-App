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
    </Stack>
  );
}
