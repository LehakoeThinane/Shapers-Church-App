import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { theme } from "./theme";

interface BlobConfig {
  size: number;
  top?: number | `${number}%`;
  left?: number | `${number}%`;
  right?: number | `${number}%`;
  bottom?: number | `${number}%`;
  duration: number;
}

const blobs: BlobConfig[] = [
  { size: 280, top: -60, left: -60, duration: 9000 },
  { size: 220, bottom: 40, right: -40, duration: 11000 },
  { size: 180, top: "40%", right: "8%", duration: 7500 },
];

function Blob({ config }: { config: BlobConfig }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: config.duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: config.duration, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, config.duration]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, config.size * 0.15] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -config.size * 0.12] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: config.top,
        left: config.left,
        right: config.right,
        bottom: config.bottom,
        width: config.size,
        height: config.size,
        borderRadius: config.size / 2,
        backgroundColor: theme.glow.soft,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    />
  );
}

// Deep backdrop + slowly drifting soft glow blobs, mounted behind
// Screen's content — glass panels need something rich behind them to
// blur/reflect against, a flat background makes the effect invisible.
export function AmbientBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.base]} pointerEvents="none">
      {blobs.map((config, i) => (
        <Blob key={i} config={config} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.color.background,
    overflow: "hidden",
  },
});
