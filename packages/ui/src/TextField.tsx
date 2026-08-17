import { useState } from "react";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { theme } from "./theme";

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

// Frosted input with a glowing focus ring — driven by onFocus/onBlur
// React state, which works identically on both platforms, so unlike
// GlassCard/Button this doesn't need a separate .web.tsx variant.
export function TextField({ label, error, style, onFocus, onBlur, ...inputProps }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={theme.color.textMuted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing(4),
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.color.textMuted,
    marginBottom: theme.spacing(1),
  },
  input: {
    backgroundColor: theme.glass.background,
    borderWidth: 1,
    borderColor: theme.glass.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing(3),
    paddingHorizontal: theme.spacing(3),
    fontSize: 16,
    color: theme.color.text,
  },
  inputFocused: {
    borderColor: theme.glow.strong,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  inputError: {
    borderColor: theme.color.danger,
  },
  error: {
    color: theme.color.danger,
    fontSize: 12,
    marginTop: theme.spacing(1),
  },
});
