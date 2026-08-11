// Placeholder palette — swap for the real Shapers Church brand colors
// once a design system is provided.
export const theme = {
  color: {
    background: "#FFFFFF",
    surface: "#F5F5F7",
    text: "#111111",
    textMuted: "#6B7280",
    primary: "#2A2A72",
    primaryText: "#FFFFFF",
    border: "#E5E7EB",
    danger: "#DC2626",
  },
  spacing: (n: number) => n * 4,
  radius: 8,
} as const;
