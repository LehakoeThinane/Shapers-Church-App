import { useRef } from "react";
import { Animated, ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { theme } from "./theme";

export interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
}

// Native: a glowing white pill (primary) or glass-outlined button
// (secondary), with a spring scale/opacity press animation. Web has its
// own implementation (Button.web.tsx) for real :hover glow.
export function Button({ title, onPress, disabled, loading, variant = "primary" }: ButtonProps) {
  const isDisabled = disabled || loading;
  const scale = useRef(new Animated.Value(1)).current;

  function animateTo(value: number) {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      onPressIn={() => animateTo(0.97)}
      onPressOut={() => animateTo(1)}
    >
      <Animated.View
        style={[
          styles.base,
          variant === "primary" ? styles.primary : styles.secondary,
          isDisabled && styles.disabled,
          { transform: [{ scale }] },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={variant === "primary" ? theme.color.primaryText : theme.color.text} />
        ) : (
          <Text style={variant === "primary" ? styles.primaryText : styles.secondaryText}>{title}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: theme.spacing(3),
    paddingHorizontal: theme.spacing(5),
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: theme.color.primary,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  secondary: {
    backgroundColor: theme.glass.background,
    borderWidth: 1,
    borderColor: theme.glass.border,
  },
  disabled: {
    opacity: 0.5,
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
