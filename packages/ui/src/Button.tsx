import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { theme } from "./theme";

export interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
}

export function Button({ title, onPress, disabled, loading, variant = "primary" }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.secondary,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? theme.color.primaryText : theme.color.primary} />
      ) : (
        <Text style={variant === "primary" ? styles.primaryText : styles.secondaryText}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: theme.spacing(3),
    paddingHorizontal: theme.spacing(5),
    borderRadius: theme.radius,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: theme.color.primary,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  primaryText: {
    color: theme.color.primaryText,
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryText: {
    color: theme.color.text,
    fontWeight: "600",
    fontSize: 16,
  },
});
