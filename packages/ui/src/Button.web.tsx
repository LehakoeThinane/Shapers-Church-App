import { ActivityIndicator, Text } from "react-native";
import { theme } from "./theme";

export interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
}

// Web: a plain <button> for real :hover/:active glow (see .sc-glass-button
// in app/globals.css) — RN Pressable's `pressed` state only tracks touch,
// not mouse hover, so it can't drive a responsive hover glow on its own.
export function Button({ title, onPress, disabled, loading, variant = "primary" }: ButtonProps) {
  const isDisabled = disabled || loading;
  const isPrimary = variant === "primary";

  return (
    <button
      onClick={onPress}
      disabled={isDisabled}
      className={isPrimary ? "sc-glass-button" : "sc-glass-button sc-glass-button--secondary"}
      style={{
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(3),
        paddingLeft: theme.spacing(5),
        paddingRight: theme.spacing(5),
        borderRadius: theme.radius.md,
        border: isPrimary ? "none" : `1px solid ${theme.glass.border}`,
        backgroundColor: isPrimary ? theme.color.primary : theme.glass.background,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: isDisabled ? 0.5 : 1,
        boxShadow: isPrimary ? "0 0 16px 0 rgba(255,255,255,0.2)" : "none",
      }}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? theme.color.primaryText : theme.color.text} />
      ) : (
        <Text
          style={{
            color: isPrimary ? theme.color.primaryText : theme.color.text,
            fontWeight: "600",
            fontSize: 16,
          }}
        >
          {title}
        </Text>
      )}
    </button>
  );
}
