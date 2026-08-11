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
