import type { ShapersClient } from "./client";

export interface SignUpInput {
  email?: string;
  phone?: string;
  password: string;
}

export interface SignInInput {
  email?: string;
  phone?: string;
  password: string;
}

// POST /auth/signup
export async function signUp(client: ShapersClient, input: SignUpInput) {
  if (!input.email && !input.phone) {
    throw new Error("signUp requires email or phone");
  }
  const { data, error } = input.email
    ? await client.auth.signUp({ email: input.email, password: input.password })
    : await client.auth.signUp({ phone: input.phone as string, password: input.password });

  if (error) throw error;
  return data;
}

// POST /auth/login
export async function signIn(client: ShapersClient, input: SignInInput) {
  if (!input.email && !input.phone) {
    throw new Error("signIn requires email or phone");
  }
  const { data, error } = input.email
    ? await client.auth.signInWithPassword({ email: input.email, password: input.password })
    : await client.auth.signInWithPassword({ phone: input.phone as string, password: input.password });

  if (error) throw error;
  return data;
}

export async function signOut(client: ShapersClient) {
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

// Kicks off the Supabase OAuth redirect flow. On web (skipBrowserRedirect
// unset) this navigates the whole page away to Google and back to
// `redirectTo`; the caller doesn't get a chance to run code after this
// resolves. On mobile, pass skipBrowserRedirect so the caller gets the
// provider URL back and can open it in an in-app browser session instead.
export async function signInWithGoogle(
  client: ShapersClient,
  redirectTo: string,
  options?: { skipBrowserRedirect?: boolean }
) {
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: options?.skipBrowserRedirect,
      // Without this, Google only hands back an email — no name — and
      // completeGoogleOnboarding() has nothing to auto-fill with, so it
      // falls back to the manual /onboarding/match form. Explicitly
      // requesting profile is what makes the silent, formless join work.
      scopes: "email profile",
      // Force the consent screen every time instead of silently reusing
      // a prior authorization — otherwise someone who already approved
      // this app under the old (email-only) scope keeps getting the old,
      // narrower grant with no profile data even after the change above.
      queryParams: { prompt: "consent" },
    },
  });
  if (error) throw error;
  return data;
}
