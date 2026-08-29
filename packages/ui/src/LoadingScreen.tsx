import React from "react";
import { ActivityIndicator, StyleSheet, View, type ImageSourcePropType } from "react-native";
import { AmbientBackground } from "./AmbientBackground";
import { Logo } from "./Logo";
import { theme } from "./theme";

export interface LoadingScreenProps {
  logoSource: ImageSourcePropType;
}

// Full-screen branded loading state — shown while a screen is deciding
// where to route (session check, /me fetch) rather than a blank flash.
// Shares AmbientBackground with Screen so this doesn't look like a
// different, flatter app while routing decisions are pending.
export function LoadingScreen({ logoSource }: LoadingScreenProps) {
  return (
    <>
      <AmbientBackground />
      <View style={styles.container}>
        <Logo source={logoSource} width={130} />
        <ActivityIndicator style={styles.spinner} color={theme.color.text} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // `flex: 1` alone doesn't fill the screen here — neither Next.js's
  // <body> nor Expo Router's screen container establish a sized flex
  // ancestor for this to grow into, so the box collapses to content
  // size instead. Anchoring to all four edges sidesteps needing a sized
  // parent at all (same trick AmbientBackground uses).
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    marginTop: theme.spacing(6),
  },
});
