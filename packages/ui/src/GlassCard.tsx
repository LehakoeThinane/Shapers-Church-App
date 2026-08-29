import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "./theme";

export interface GlassCardProps {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: "default" | "elevated";
}

// Native: a 1px gradient "border" (the padding trick — the gradient
// fills the outer shape, the blur panel sits inset by `padding`, so only
// a thin ring of the gradient shows) plus a slow-pulsing colored shadow
// for the glow. Web has its own implementation (GlassCard.web.tsx) using
// real CSS backdrop-filter/box-shadow, which reads far better there.
export function GlassCard({ children, style, variant = "default" }: GlassCardProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: theme.motion.duration.slow,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: theme.motion.duration.slow,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const shadowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.4] });

  return (
    <Animated.View style={[styles.shadowWrap, { shadowOpacity }, style]}>
      <LinearGradient
        colors={["rgba(255,255,255,0.5)", "rgba(255,255,255,0.08)", "rgba(255,255,255,0.5)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <BlurView
          intensity={40}
          tint="dark"
          style={[
            styles.inner,
            {
              backgroundColor:
                variant === "elevated" ? theme.glass.backgroundElevated : theme.glass.background,
            },
          ]}
        >
          {children}
        </BlurView>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: theme.radius.lg,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
  },
  gradientBorder: {
    borderRadius: theme.radius.lg,
    padding: 1,
  },
  inner: {
    borderRadius: theme.radius.lg - 1,
    overflow: "hidden",
    padding: theme.spacing(4),
  },
});
