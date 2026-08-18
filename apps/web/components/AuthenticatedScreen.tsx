import type { ImageSourcePropType, ViewProps } from "react-native";
import { Screen } from "@shapers/ui";
import { NavBar } from "./NavBar";

export interface AuthenticatedScreenProps extends ViewProps {
  logoSource: ImageSourcePropType;
}

// Every signed-in page should use this instead of Screen directly — it's
// Screen plus the persistent NavBar, in one place, so nav markup isn't
// repeated on every page. Unauthenticated pages (/login, /signup,
// /join/[code]) keep using Screen directly; they have nothing to navigate
// to yet.
export function AuthenticatedScreen({ children, ...rest }: AuthenticatedScreenProps) {
  return (
    <Screen {...rest}>
      <NavBar />
      {children}
    </Screen>
  );
}
