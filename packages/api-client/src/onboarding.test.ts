import { describe, expect, it, vi } from "vitest";
import type { ShapersClient } from "./client";
import { becomeMember, completeGoogleOnboarding, matchPerson } from "./onboarding";

// Minimal mock of the ShapersClient surface these functions actually
// touch (auth.getUser + rpc). Cast to ShapersClient rather than
// hand-rolling the full SupabaseClient<Database> type.
function mockClient(opts: {
  user?: { email?: string | null; user_metadata?: Record<string, unknown> } | null;
  rpc?: Record<string, unknown>;
}) {
  const rpcResults = opts.rpc ?? {};
  const rpc = vi.fn(async (fn: string) => {
    if (fn in rpcResults) return { data: rpcResults[fn], error: null };
    throw new Error(`unexpected rpc call: ${fn}`);
  });
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: opts.user ?? null } })) },
    rpc,
  } as unknown as ShapersClient;
}

describe("completeGoogleOnboarding", () => {
  // This is the exact bug class that shipped: requiring BOTH first and
  // last name before proceeding meant a single-word Google display name
  // (no space to split on) silently fell back to the manual onboarding
  // form instead of completing automatically — the whole point of this
  // function. These cases must never return null for a signed-in user.

  it("returns null with no signed-in user", async () => {
    const client = mockClient({ user: null });
    await expect(completeGoogleOnboarding(client)).resolves.toBeNull();
  });

  it("returns null if there is no church to join yet", async () => {
    const client = mockClient({
      user: { email: "a@b.com", user_metadata: { given_name: "A", family_name: "B" } },
      rpc: { get_default_church: [] },
    });
    await expect(completeGoogleOnboarding(client)).resolves.toBeNull();
  });

  it("uses given_name/family_name when present", async () => {
    const client = mockClient({
      user: { email: "a@b.com", user_metadata: { given_name: "Ada", family_name: "Lovelace" } },
      rpc: {
        get_default_church: [{ id: "church-1", name: "Test Church" }],
        onboard_match_person: "person-1",
      },
    });
    await expect(completeGoogleOnboarding(client)).resolves.toBe("person-1");
    expect(client.rpc).toHaveBeenCalledWith(
      "onboard_match_person",
      expect.objectContaining({ p_first_name: "Ada", p_last_name: "Lovelace" })
    );
  });

  it("splits a two-word full_name when given_name/family_name are absent", async () => {
    const client = mockClient({
      user: { email: "a@b.com", user_metadata: { full_name: "Grace Hopper" } },
      rpc: {
        get_default_church: [{ id: "church-1", name: "Test Church" }],
        onboard_match_person: "person-1",
      },
    });
    await completeGoogleOnboarding(client);
    expect(client.rpc).toHaveBeenCalledWith(
      "onboard_match_person",
      expect.objectContaining({ p_first_name: "Grace", p_last_name: "Hopper" })
    );
  });

  it("completes with a single-word name instead of falling back to the manual form", async () => {
    const client = mockClient({
      user: { email: "a@b.com", user_metadata: { full_name: "Cher" } },
      rpc: {
        get_default_church: [{ id: "church-1", name: "Test Church" }],
        onboard_match_person: "person-1",
      },
    });
    await expect(completeGoogleOnboarding(client)).resolves.toBe("person-1");
    expect(client.rpc).toHaveBeenCalledWith(
      "onboard_match_person",
      expect.objectContaining({ p_first_name: "Cher", p_last_name: "" })
    );
  });

  it("falls back to the email's local part when Google gives no name at all", async () => {
    const client = mockClient({
      user: { email: "jdoe@example.com", user_metadata: {} },
      rpc: {
        get_default_church: [{ id: "church-1", name: "Test Church" }],
        onboard_match_person: "person-1",
      },
    });
    await completeGoogleOnboarding(client);
    expect(client.rpc).toHaveBeenCalledWith(
      "onboard_match_person",
      expect.objectContaining({ p_first_name: "jdoe" })
    );
  });

  it("falls back to a literal placeholder when there is no name and no email", async () => {
    const client = mockClient({
      user: { email: null, user_metadata: {} },
      rpc: {
        get_default_church: [{ id: "church-1", name: "Test Church" }],
        onboard_match_person: "person-1",
      },
    });
    await completeGoogleOnboarding(client);
    expect(client.rpc).toHaveBeenCalledWith(
      "onboard_match_person",
      expect.objectContaining({ p_first_name: "Member" })
    );
  });
});

describe("matchPerson", () => {
  it("throws when the RPC errors", async () => {
    const client = {
      rpc: vi.fn(async () => ({ data: null, error: new Error("boom") })),
    } as unknown as ShapersClient;
    await expect(
      matchPerson(client, { churchId: "c1", firstName: "A", lastName: "B" })
    ).rejects.toThrow("boom");
  });
});

describe("becomeMember", () => {
  it("throws on an invalid invite code instead of failing silently", async () => {
    const client = {
      rpc: vi.fn(async () => ({ data: null, error: new Error("invalid invite code") })),
    } as unknown as ShapersClient;
    await expect(becomeMember(client, "BADCODE")).rejects.toThrow("invalid invite code");
  });
});
