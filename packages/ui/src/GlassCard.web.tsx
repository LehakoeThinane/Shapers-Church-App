import type { CSSProperties, ReactNode } from "react";
import type { ViewStyle } from "react-native";
import { theme } from "./theme";

export interface GlassCardProps {
  children?: ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: "default" | "elevated";
}

// Web: real backdrop-filter blur + an animated glow pulse, both defined
// in app/globals.css (RN-Web doesn't expose either through its typed
// style API, so this renders a plain <div> instead of RN's View).
export function GlassCard({ children, style, variant = "default" }: GlassCardProps) {
  const className = variant === "elevated" ? "sc-glass-card sc-glass-card--elevated" : "sc-glass-card";
  return (
    <div
      className={className}
      style={{
        padding: theme.spacing(4),
        ...(flattenStyle(style) as CSSProperties),
      }}
    >
      {children}
    </div>
  );
}

function flattenStyle(style?: ViewStyle | ViewStyle[]): ViewStyle {
  if (!style) return {};
  return Array.isArray(style) ? Object.assign({}, ...style) : style;
}
