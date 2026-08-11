import React from "react";
import { ScrollView, StyleSheet, View, type ImageSourcePropType, type ViewProps } from "react-native";
import { BrandHeader } from "./BrandHeader";
import { theme } from "./theme";

export interface ScreenProps extends ViewProps {
  logoSource?: ImageSourcePropType;
}

export function Screen({ children, style, logoSource, ...rest }: ScreenProps) {
  return (
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
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: theme.color.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
  },
  inner: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    padding: theme.spacing(6),
  },
});
