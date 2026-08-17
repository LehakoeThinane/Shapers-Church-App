import React from "react";
import { StyleSheet, View, type ImageSourcePropType } from "react-native";
import { BlurView } from "expo-blur";
import { Logo } from "./Logo";
import { theme } from "./theme";

export interface BrandHeaderProps {
  logoSource: ImageSourcePropType;
}

// Frosted glass band with a glowing bottom edge line — the page itself
// is dark now (AmbientBackground), so this no longer needs to be an
// opaque black band just to give the light logo mark somewhere to sit;
// it's a glass panel like everything else. Web has its own sticky +
// real-blur implementation (BrandHeader.web.tsx).
export function BrandHeader({ logoSource }: BrandHeaderProps) {
  return (
    <BlurView intensity={30} tint="dark" style={styles.band}>
      <Logo source={logoSource} width={130} />
      <View style={styles.glowLine} />
    </BlurView>
  );
}

const styles = StyleSheet.create({
  band: {
    width: "100%",
    paddingVertical: theme.spacing(8),
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  glowLine: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: theme.glow.soft,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
});
