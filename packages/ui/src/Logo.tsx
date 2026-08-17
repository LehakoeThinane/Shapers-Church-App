import React from "react";
import { Image, type ImageSourcePropType } from "react-native";

// Source logo file is 150x100 (3:2). The mark is light gray on a
// transparent background — designed to sit on a dark surface, not
// directly on a white page (see BrandHeader).
const ASPECT_RATIO = 150 / 100;

export interface LogoProps {
  source: ImageSourcePropType;
  width?: number;
}

export function Logo({ source, width = 140 }: LogoProps) {
  return (
    <Image
      source={source}
      accessibilityLabel="Shapers Church"
      resizeMode="contain"
      style={{
        width,
        height: width / ASPECT_RATIO,
        shadowColor: "#FFFFFF",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      }}
    />
  );
}
