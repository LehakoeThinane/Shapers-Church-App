import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { theme } from "./theme";

export type TextProps = RNTextProps;

// React Native (and react-native-web, mirroring it) defaults an
// un-nested Text's color to plain black — it does NOT inherit CSS color
// from further up the DOM the way a plain <p> or <span> would. Every
// heading/label across both apps was silently rendering as black text on
// this app's near-black background until it explicitly set its own
// color; this wrapper defaults to theme.color.text instead, while still
// letting a caller's own `color` win (their style is applied second, so
// it overrides the default in the same object).
export function Text({ style, ...rest }: TextProps) {
  return <RNText style={[{ color: theme.color.text }, style]} {...rest} />;
}
