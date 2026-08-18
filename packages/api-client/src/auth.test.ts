import { describe, expect, it, vi } from "vitest";
import type { ShapersClient } from "./client";
import { extractOAuthCodeFromUrl, signIn, signUp } from "./auth";

describe("signUp", () => {
  it("throws when given neither email nor phone", async () => {
    const client = { auth: { signUp: vi.fn() } } as unknown as ShapersClient;
    await expect(signUp(client, { password: "hunter2" })).rejects.toThrow("signUp requires email or phone");
    expect(client.auth.signUp).not.toHaveBeenCalled();
  });

  it("signs up with email when provided", async () => {
    const client = {
      auth: { signUp: vi.fn(async () => ({ data: { user: { id: "u1" } }, error: null })) },
    } as unknown as ShapersClient;

    await signUp(client, { email: "a@b.com", password: "hunter2" });
    expect(client.auth.signUp).toHaveBeenCalledWith({ email: "a@b.com", password: "hunter2" });
  });

  it("signs up with phone when no email is provided", async () => {
    const client = {
      auth: { signUp: vi.fn(async () => ({ data: { user: { id: "u1" } }, error: null })) },
    } as unknown as ShapersClient;

    await signUp(client, { phone: "+15555550100", password: "hunter2" });
    expect(client.auth.signUp).toHaveBeenCalledWith({ phone: "+15555550100", password: "hunter2" });
  });

  it("throws the underlying Supabase error", async () => {
    const client = {
      auth: { signUp: vi.fn(async () => ({ data: null, error: new Error("email already registered") })) },
    } as unknown as ShapersClient;
    await expect(signUp(client, { email: "a@b.com", password: "hunter2" })).rejects.toThrow(
      "email already registered"
    );
  });
});

describe("signIn", () => {
  it("throws when given neither email nor phone", async () => {
    const client = { auth: { signInWithPassword: vi.fn() } } as unknown as ShapersClient;
    await expect(signIn(client, { password: "hunter2" })).rejects.toThrow("signIn requires email or phone");
    expect(client.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("throws the underlying Supabase error", async () => {
    const client = {
      auth: {
        signInWithPassword: vi.fn(async () => ({ data: null, error: new Error("invalid credentials") })),
      },
    } as unknown as ShapersClient;
    await expect(signIn(client, { email: "a@b.com", password: "wrong" })).rejects.toThrow(
      "invalid credentials"
    );
  });
});

describe("extractOAuthCodeFromUrl", () => {
  it("extracts the code from a PKCE redirect", () => {
    expect(extractOAuthCodeFromUrl("shapers://auth/callback?code=abc123")).toBe("abc123");
  });

  it("extracts the code when other query params are present", () => {
    expect(
      extractOAuthCodeFromUrl("shapers://auth/callback?state=xyz&code=abc123&sb_flow_id=flow-1")
    ).toBe("abc123");
  });

  it("ignores a trailing fragment after the query string", () => {
    expect(extractOAuthCodeFromUrl("shapers://auth/callback?code=abc123#some-fragment")).toBe("abc123");
  });

  it("returns null when there is no query string at all", () => {
    expect(extractOAuthCodeFromUrl("shapers://auth/callback")).toBeNull();
  });

  it("returns null when the query string has no code param", () => {
    // The class of URL a stale implicit-flow redirect (or a cancelled/
    // errored OAuth attempt) would produce — must not be mistaken for a
    // successful PKCE callback.
    expect(extractOAuthCodeFromUrl("shapers://auth/callback?error=access_denied")).toBeNull();
  });
});
