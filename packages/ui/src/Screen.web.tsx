import React from "react";
import { ScrollView, StyleSheet, View, type ImageSourcePropType, type ViewProps } from "react-native";
import { AmbientBackground } from "./AmbientBackground";
import { BrandHeader } from "./BrandHeader";
import { theme } from "./theme";

export interface ScreenProps extends ViewProps {
  logoSource?: ImageSourcePropType;
}

// Web: every other Liquid Glass component (GlassCard, Button, BrandHeader,
// AmbientBackground) already has a .web.tsx variant with real web-specific
// treatment — Screen never did, so it kept using the 420px column sized
// for a phone screen even on a full desktop browser window, leaving most
// of the viewport empty and everything else looking cramped by
// comparison. Same structure as the native Screen, just a desktop-width
// column instead of a phone-width one.
export function Screen({ children, style, logoSource, ...rest }: ScreenProps) {
  return (
    <>
      <AmbientBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {logoSource ? <BrandHeader logoSource={logoSource} /> : null}
        <View style={[styles.inner, style]} {...rest}>
          {children}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
  },
  inner: {
    width: "100%",
    maxWidth: 820,
    alignSelf: "center",
    padding: theme.spacing(8),
  },
});
