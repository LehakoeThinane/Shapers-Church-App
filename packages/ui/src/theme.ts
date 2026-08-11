// Matches shaperschurch.com: strict black/white/gray, no color accents.
// Error/danger red is kept as a semantic exception (form validation),
// not a brand color.
export const theme = {
  color: {
    background: "#FFFFFF",
    surface: "#F5F5F7",
    text: "#111111",
    textMuted: "#6B7280",
    primary: "#000000",
    primaryText: "#FFFFFF",
    border: "#E5E7EB",
    danger: "#DC2626",
  },
  spacing: (n: number) => n * 4,
  radius: 8,
} as const;
