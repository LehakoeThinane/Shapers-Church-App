import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { signInWithGoogle, type ShapersClient } from "@shapers/api-client";

// Supabase's default (implicit) OAuth flow returns tokens in the URL
// fragment, e.g. shapers://auth/callback#access_token=...&refresh_token=...
// rather than as query params, so Linking.parse() won't pick them up.
function parseTokensFromUrl(url: string): { access_token: string; refresh_token: string } | null {
  const fragment = url.split("#")[1] ?? url.split("?")[1];
  if (!fragment) return null;
  const params = new URLSearchParams(fragment);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

// Opens Google sign-in in an in-app browser session and establishes the
// Supabase session from the redirect it returns with. Returns false if the
// person closed the browser without completing sign-in.
export async function signInWithGoogleMobile(client: ShapersClient): Promise<boolean> {
  const redirectTo = Linking.createURL("auth/callback");
  const data = await signInWithGoogle(client, redirectTo, { skipBrowserRedirect: true });
  if (!data?.url) throw new Error("Google sign-in didn't return a URL");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") {
    return false;
  }

  const tokens = parseTokensFromUrl(result.url);
  if (!tokens) throw new Error("Sign-in didn't complete — please try again.");

  const { error } = await client.auth.setSession(tokens);
  if (error) throw error;
  return true;
}
