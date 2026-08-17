// Liquid Glass: deep, near-black backdrop with frosted glass panels and
// soft white/silver glows — no color accents (matches the earlier
// black/white/gray brand decision; glow color is monochrome, not a new
// hue). Glass/blur effects need a rich backdrop to blur *against* — see
// AmbientBackground, mounted by Screen behind everything.
export const theme = {
  color: {
    background: "#050506",
    surface: "rgba(255, 255, 255, 0.06)",
    text: "#F5F5F7",
    textMuted: "#9CA3AF",
    primary: "#FFFFFF",
    primaryText: "#0A0A0C",
    border: "rgba(255, 255, 255, 0.14)",
    danger: "#F87171",
  },
  // Frosted-panel surfaces (GlassCard, glass header, glass inputs).
  glass: {
    background: "rgba(255, 255, 255, 0.07)",
    backgroundElevated: "rgba(255, 255, 255, 0.11)",
    border: "rgba(255, 255, 255, 0.16)",
  },
  // The monochrome white/silver glow used for card edges, the header's
  // bottom line, ambient background blooms, and press/hover/focus states.
  glow: {
    color: "255, 255, 255",
    soft: "rgba(255, 255, 255, 0.22)",
    strong: "rgba(255, 255, 255, 0.45)",
  },
  spacing: (n: number) => n * 4,
  // Liquid Glass wants bigger, continuous corners than the old flat 8px.
  radius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
  },
  motion: {
    duration: {
      fast: 150,
      base: 300,
      slow: 2400,
    },
    easing: {
      standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },
} as const;
