import React from "react";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { theme } from "./theme";

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function TextField({ label, error, style, ...inputProps }: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={theme.color.textMuted}
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
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius,
    paddingVertical: theme.spacing(3),
    paddingHorizontal: theme.spacing(3),
    fontSize: 16,
    color: theme.color.text,
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
