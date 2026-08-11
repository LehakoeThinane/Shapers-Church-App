import React from "react";
import { StyleSheet, View, type ImageSourcePropType } from "react-native";
import { Logo } from "./Logo";
import { theme } from "./theme";

export interface BrandHeaderProps {
  logoSource: ImageSourcePropType;
}

// Dark band behind the logo — the mark itself is light gray on
// transparent, so it disappears against Screen's white background
// without one.
export function BrandHeader({ logoSource }: BrandHeaderProps) {
  return (
    <View style={styles.band}>
      <Logo source={logoSource} width={130} />
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    width: "100%",
    backgroundColor: theme.color.primary,
    paddingVertical: theme.spacing(8),
    alignItems: "center",
    justifyContent: "center",
  },
});
