/**
 * Auth redirect contract tests
 *
 * These verify that every redirect URL in the auth flow points to the
 * correct destination. They read the actual source files and assert on
 * the URLs — so if anyone changes a redirect, the test fails immediately
 * without needing to manually click through OAuth in a browser.
 *
 * Expected contract:
 *   sign-UP  → /hackathon  (all paths: email verify, OAuth, SSO callback)
 *   sign-IN  → /dashboard  (all paths: email, OAuth, SSO callback)
 *   SSO callback from sign-up → /hackathon (even if Clerk "transfers" to sign-in)
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const root = resolve(__dirname, "../..");

function read(relPath: string) {
  return readFileSync(resolve(root, relPath), "utf-8");
}

describe("auth redirect contract", () => {
  describe("sign-up page", () => {
    const src = read("app/(auth)/sign-up/page.tsx");

    it("OAuth redirectUrlComplete points to /hackathon", () => {
      expect(src).toMatch(/redirectUrlComplete:\s*["']\/hackathon["']/);
    });

    it("email verification router.push points to /hackathon", () => {
      expect(src).toMatch(/router\.push\(["']\/hackathon["']\)/);
    });

    it("does NOT contain any redirect to /dashboard or /", () => {
      // Catch accidental "/" or "/dashboard" redirects in the sign-up page
      const oauthRedirects = [...src.matchAll(/redirectUrlComplete:\s*["']([^"']+)["']/g)];
      const routerPushes = [...src.matchAll(/router\.push\(["']([^"']+)["']\)/g)];

      for (const m of [...oauthRedirects, ...routerPushes]) {
        expect(m[1]).toBe("/hackathon");
      }
    });
  });

  describe("sign-in page", () => {
    const src = read("app/(auth)/sign-in/page.tsx");

    it("OAuth redirectUrlComplete points to /dashboard", () => {
      expect(src).toMatch(/redirectUrlComplete:\s*["']\/dashboard["']/);
    });

    it("email sign-in router.push points to /dashboard", () => {
      expect(src).toMatch(/router\.push\(["']\/dashboard["']\)/);
    });

    it("does NOT contain any redirect to / root", () => {
      const oauthRedirects = [...src.matchAll(/redirectUrlComplete:\s*["']([^"']+)["']/g)];
      const routerPushes = [...src.matchAll(/router\.push\(["']([^"']+)["']\)/g)];

      for (const m of [...oauthRedirects, ...routerPushes]) {
        expect(m[1]).toBe("/dashboard");
      }
    });
  });

  describe("sign-up SSO callback", () => {
    const src = read("app/(auth)/sign-up/sso-callback/page.tsx");

    it("forces sign-up redirect to /hackathon", () => {
      expect(src).toMatch(/signUpForceRedirectUrl=["']\/hackathon["']/);
    });

    it("forces sign-in transfer redirect to /hackathon", () => {
      // This is the critical one — when Clerk "transfers" an existing
      // user from sign-up to sign-in, we still want /hackathon
      expect(src).toMatch(/signInForceRedirectUrl=["']\/hackathon["']/);
    });
  });

  describe("sign-in SSO callback", () => {
    const src = read("app/(auth)/sign-in/sso-callback/page.tsx");

    it("forces sign-in redirect to /dashboard", () => {
      expect(src).toMatch(/signInForceRedirectUrl=["']\/dashboard["']/);
    });

    it("forces sign-up transfer redirect to /hackathon", () => {
      expect(src).toMatch(/signUpForceRedirectUrl=["']\/hackathon["']/);
    });
  });
});
