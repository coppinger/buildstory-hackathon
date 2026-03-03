import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────────────

// Holder for the callback passed to clerkMiddleware
const holder: {
  callback?: (
    auth: () => Promise<{ userId: string | null }>,
    request: NextRequest
  ) => Promise<Response | undefined>;
} = {};

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: (cb: typeof holder.callback) => {
    holder.callback = cb;
    return () => {};
  },
}));

vi.mock("@/lib/db/ensure-profile", () => ({
  ensureProfile: vi.fn().mockResolvedValue({
    id: "profile-123",
    bannedAt: null,
    hiddenAt: null,
  }),
}));

vi.mock("@/lib/admin", () => ({
  isAdmin: vi.fn((id: string) => Promise.resolve(id === "admin-user")),
  isSuperAdmin: vi.fn((id: string) => id === "admin-user"),
  canAccessAdmin: vi.fn((id: string) => Promise.resolve(id === "admin-user")),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const BASE = "https://buildstory.dev";

function makeRequest(path: string, cookies?: Record<string, string>) {
  const url = new URL(path, BASE);
  const req = new NextRequest(url);
  if (cookies) {
    for (const [k, v] of Object.entries(cookies)) {
      req.cookies.set(k, v);
    }
  }
  return req;
}

function authAs(userId: string | null) {
  return () => Promise.resolve({ userId });
}

function redirectLocation(response: Response | undefined): string | null {
  if (!response) return null;
  return response.headers.get("Location");
}

function isRedirectTo(response: Response | undefined, path: string): boolean {
  const loc = redirectLocation(response);
  if (!loc) return false;
  return new URL(loc).pathname === path;
}

// Shorthand that asserts callback was captured
function invoke(
  auth: () => Promise<{ userId: string | null }>,
  request: NextRequest
) {
  return holder.callback!(auth, request);
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  // Import proxy to trigger clerkMiddleware() and capture the callback
  await import("@/proxy");
});

describe("proxy middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("landing page redirect", () => {
    it("redirects signed-in users from / to /dashboard", async () => {
      const res = await invoke(authAs("user-1"), makeRequest("/"));
      expect(isRedirectTo(res, "/dashboard")).toBe(true);
    });

    it("does not redirect signed-out users from /", async () => {
      const res = await invoke(authAs(null), makeRequest("/"));
      expect(redirectLocation(res)).toBeNull();
    });
  });

  describe("admin route protection", () => {
    it("redirects non-admin users from /admin to /", async () => {
      const req = makeRequest("/admin/dashboard", {
        bs_profile: "user-1:profile-123",
      });
      const res = await invoke(authAs("user-1"), req);
      expect(isRedirectTo(res, "/")).toBe(true);
    });

    it("redirects signed-out users from /admin to /", async () => {
      const res = await invoke(authAs(null), makeRequest("/admin/dashboard"));
      expect(isRedirectTo(res, "/")).toBe(true);
    });

    it("allows admin users through to /admin", async () => {
      const req = makeRequest("/admin/dashboard", {
        bs_profile: "admin-user:profile-456",
      });
      const res = await invoke(authAs("admin-user"), req);
      expect(redirectLocation(res)).toBeNull();
    });
  });

  describe("profile cookie", () => {
    it("sets profile cookie when user has no matching cookie", async () => {
      const { ensureProfile } = await import("@/lib/db/ensure-profile");
      vi.mocked(ensureProfile).mockResolvedValueOnce({
        id: "profile-new",
        clerkId: "user-2",
        username: null,
        displayName: "Test",
        bio: null,
        githubUrl: null,
        xUrl: null,
        linkedinUrl: null,
        websiteUrl: null,
        experienceLevel: null,
        bannedAt: null,
        hiddenAt: null,
        createdAt: new Date(),
      });

      const res = await invoke(authAs("user-2"), makeRequest("/hackathon"));

      expect(ensureProfile).toHaveBeenCalledWith("user-2");
      expect(res).toBeDefined();
      const setCookie = res!.headers.get("set-cookie");
      expect(setCookie).toContain("bs_profile=");
      expect(setCookie).toContain("user-2");
      expect(setCookie).toContain("profile-new");
    });

    it("skips profile creation when cookie already matches", async () => {
      const { ensureProfile } = await import("@/lib/db/ensure-profile");

      const req = makeRequest("/hackathon", {
        bs_profile: "user-3:profile-existing",
      });
      const res = await invoke(authAs("user-3"), req);

      expect(ensureProfile).not.toHaveBeenCalled();
      expect(redirectLocation(res)).toBeNull();
    });

    it("reports errors to Sentry without blocking the request", async () => {
      const { ensureProfile } = await import("@/lib/db/ensure-profile");
      const Sentry = await import("@sentry/nextjs");
      const testError = new Error("db connection failed");
      vi.mocked(ensureProfile).mockRejectedValueOnce(testError);

      const res = await invoke(authAs("user-4"), makeRequest("/hackathon"));

      expect(Sentry.captureException).toHaveBeenCalledWith(testError, {
        tags: { component: "middleware", action: "ensure-profile" },
        extra: { clerkId: "user-4" },
      });
      // Should not crash — request continues
      expect(redirectLocation(res)).toBeNull();
    });
  });

  describe("normal routes", () => {
    it("does not redirect signed-in users on non-root routes", async () => {
      const req = makeRequest("/hackathon", {
        bs_profile: "user-5:profile-xyz",
      });
      const res = await invoke(authAs("user-5"), req);
      expect(redirectLocation(res)).toBeNull();
    });

    it("does not redirect signed-out users on non-root routes", async () => {
      const res = await invoke(authAs(null), makeRequest("/sign-in"));
      expect(redirectLocation(res)).toBeNull();
    });
  });
});
