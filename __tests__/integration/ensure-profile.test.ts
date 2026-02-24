import { describe, it, expect, vi, afterAll } from "vitest";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq, like } from "drizzle-orm";

// Mock Clerk — ensureProfile calls clerkClient().users.getUser()
vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: () =>
    Promise.resolve({
      users: {
        getUser: () =>
          Promise.resolve({
            firstName: "Test",
            lastName: "Builder",
            username: "testbuilder",
          }),
      },
    }),
}));

import { ensureProfile } from "@/lib/db/ensure-profile";

const TEST_PREFIX = "test_clerk_";

afterAll(async () => {
  await db.delete(profiles).where(like(profiles.clerkId, `${TEST_PREFIX}%`));
});

function testClerkId() {
  return `${TEST_PREFIX}${crypto.randomUUID()}`;
}

describe("ensureProfile", () => {
  it("creates a new profile when none exists", async () => {
    const clerkId = testClerkId();
    const profile = await ensureProfile(clerkId);

    expect(profile).toBeDefined();
    expect(profile!.clerkId).toBe(clerkId);
    expect(profile!.displayName).toBe("Test Builder");
    expect(profile!.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it("returns the existing profile on subsequent calls", async () => {
    const clerkId = testClerkId();
    const first = await ensureProfile(clerkId);
    const second = await ensureProfile(clerkId);

    expect(first!.id).toBe(second!.id);
    expect(first!.displayName).toBe(second!.displayName);
  });

  it("handles concurrent calls safely (race condition)", async () => {
    const clerkId = testClerkId();

    const results = await Promise.all([
      ensureProfile(clerkId),
      ensureProfile(clerkId),
      ensureProfile(clerkId),
    ]);

    const ids = results.map((r) => r!.id);
    // All three calls should resolve to the same profile
    expect(new Set(ids).size).toBe(1);
  });

  it("persists the profile in the database", async () => {
    const clerkId = testClerkId();
    await ensureProfile(clerkId);

    // Query directly — bypass ensureProfile
    const row = await db.query.profiles.findFirst({
      where: eq(profiles.clerkId, clerkId),
    });

    expect(row).toBeDefined();
    expect(row!.clerkId).toBe(clerkId);
    expect(row!.createdAt).toBeInstanceOf(Date);
  });
});
