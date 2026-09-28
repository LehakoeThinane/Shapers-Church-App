import { View } from "react-native";
import { GlassCard } from "./GlassCard";
import { Text } from "./Text";
import { theme } from "./theme";

export interface MilestoneMomentProps { milestone: string; }

const labels: Record<string, string> = {
  growth_track_complete: "Growth Track complete",
  baptism: "Baptism",
  first_tithe: "First tithe",
  first_serve: "First time serving",
  one_year_anniversary: "One year with Shapers",
};

// A shared completion state, intentionally data-driven so new milestone
// types never require another screen-specific implementation.
export function MilestoneMoment({ milestone }: MilestoneMomentProps) {
  return <GlassCard style={{ marginBottom: theme.spacing(4), borderColor: theme.glow.strong, borderWidth: 1 }}>
    <View style={{ alignItems: "center", paddingVertical: theme.spacing(3) }}>
      <Text style={{ fontSize: 30, marginBottom: 6 }}>✦</Text>
      <Text style={{ color: theme.color.textMuted, fontSize: 12, letterSpacing: 1, marginBottom: 4 }}>MILESTONE UNLOCKED</Text>
      <Text style={{ fontWeight: "700", fontSize: 21, textAlign: "center", marginBottom: 6 }}>{labels[milestone] ?? milestone.replaceAll("_", " ")}</Text>
      <Text style={{ color: theme.color.textMuted, textAlign: "center" }}>Praise God for this next step in your journey.</Text>
    </View>
  </GlassCard>;
}
