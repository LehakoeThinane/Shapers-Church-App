import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { extractOAuthCodeFromUrl, signInWithGoogle, type ShapersClient } from "@shapers/api-client";

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

  const code = extractOAuthCodeFromUrl(result.url);
  if (!code) throw new Error("Sign-in didn't complete — please try again.");

  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error) throw error;
  return true;
}
