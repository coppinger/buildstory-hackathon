import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Claude Code worktrees
    ".claude/worktrees/**",
  ]),
  {
    rules: {
      // All <img> usage in this project is local SVGs where next/image adds no value
      "@next/next/no-img-element": "off",
      // Prevent accidental console.log; allow warn/error for server-side logging
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // Flag let declarations that are never reassigned
      "prefer-const": "warn",
      // Enforce === over == (allow == null for idiomatic null/undefined checks)
      "eqeqeq": ["warn", "always", { null: "ignore" }],
    },
  },
]);

export default eslintConfig;
