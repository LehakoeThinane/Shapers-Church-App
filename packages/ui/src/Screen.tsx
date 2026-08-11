import React from "react";
import { ScrollView, StyleSheet, View, type ViewProps } from "react-native";
import { theme } from "./theme";

export function Screen({ children, style, ...rest }: ViewProps) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
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
