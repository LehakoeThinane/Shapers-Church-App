import { describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn((..._args: unknown[]) => ({ mocked: true }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

const { createShapersClient } = await import("./client");

describe("createShapersClient", () => {
  it("throws when url is missing", () => {
    expect(() => createShapersClient({ url: "", anonKey: "key" })).toThrow(
      "createShapersClient: both url and anonKey are required"
    );
  });

  it("throws when anonKey is missing", () => {
    expect(() => createShapersClient({ url: "https://x.supabase.co", anonKey: "" })).toThrow(
      "createShapersClient: both url and anonKey are required"
    );
  });

  it("enables detectSessionInUrl when no storage is given (web)", () => {
    createShapersClient({ url: "https://x.supabase.co", anonKey: "key" });
    expect(createClientMock).toHaveBeenCalledWith(
      "https://x.supabase.co",
      "key",
      expect.objectContaining({
        auth: expect.objectContaining({ detectSessionInUrl: true, storage: undefined }),
      })
    );
  });

  it("disables detectSessionInUrl and passes storage through when given (native)", () => {
    // Getting `!storage` backwards here either breaks web magic-link
    // handling or has RN try to parse a URL that doesn't exist — worth
    // pinning down explicitly rather than trusting it stays right.
    const storage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() };
    createShapersClient({ url: "https://x.supabase.co", anonKey: "key", storage });
    expect(createClientMock).toHaveBeenCalledWith(
      "https://x.supabase.co",
      "key",
      expect.objectContaining({
        auth: expect.objectContaining({ detectSessionInUrl: false, storage }),
      })
    );
  });
});
