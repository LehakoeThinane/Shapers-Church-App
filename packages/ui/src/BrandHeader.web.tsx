import type { ImageSourcePropType } from "react-native";
import { Logo } from "./Logo";
import { theme } from "./theme";

// Deliberately not imported from "./BrandHeader" — that specifier
// resolves to *this* file first under webpack's .web.tsx priority, so a
// cross-import back to the native file (which pulls in expo-blur) would
// self-reference. Kept as a tiny duplicate type instead.
export interface BrandHeaderProps {
  logoSource: ImageSourcePropType;
}

// Web: sticky + real backdrop-filter blur, defined in app/globals.css
// (.sc-glass-header, including the glowing bottom edge line).
export function BrandHeader({ logoSource }: BrandHeaderProps) {
  return (
    <div
      className="sc-glass-header"
      style={{
        width: "100%",
        paddingTop: theme.spacing(8),
        paddingBottom: theme.spacing(8),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Logo source={logoSource} width={130} />
    </div>
  );
}
