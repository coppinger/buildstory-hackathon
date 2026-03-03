import { describe, it, expect } from "vitest";
import { truncateForMeta, ogMeta, notFoundMeta } from "@/lib/metadata";

describe("truncateForMeta", () => {
  it("returns short text unchanged", () => {
    expect(truncateForMeta("Hello world")).toBe("Hello world");
  });

  it("returns text at exactly maxLength unchanged", () => {
    const text = "a".repeat(160);
    expect(truncateForMeta(text)).toBe(text);
  });

  it("truncates at word boundary with ellipsis", () => {
    const text = "word ".repeat(40); // 200 chars
    const result = truncateForMeta(text);
    expect(result.length).toBeLessThanOrEqual(160);
    expect(result).toMatch(/\.\.\.$/);
  });

  it("never exceeds maxLength including ellipsis", () => {
    const text = "a ".repeat(100);
    const result = truncateForMeta(text, 50);
    expect(result.length).toBeLessThanOrEqual(50);
  });

  it("handles text with no spaces", () => {
    const text = "a".repeat(200);
    const result = truncateForMeta(text);
    expect(result).toBe("a".repeat(157) + "...");
    expect(result.length).toBe(160);
  });

  it("strips markdown before truncating", () => {
    const text = "**bold** and *italic* and [link](https://example.com)";
    const result = truncateForMeta(text);
    expect(result).not.toContain("**");
    expect(result).not.toContain("*");
    expect(result).not.toContain("[");
    expect(result).toContain("bold");
    expect(result).toContain("link");
  });

  it("collapses newlines into spaces", () => {
    const text = "line one\n\nline two\nline three";
    expect(truncateForMeta(text)).toBe("line one line two line three");
  });

  it("respects custom maxLength", () => {
    const text = "one two three four five six seven";
    const result = truncateForMeta(text, 20);
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result).toMatch(/\.\.\.$/);
  });
});

describe("ogMeta", () => {
  it("sets title across all fields", () => {
    const meta = ogMeta("My Page");
    expect(meta.title).toBe("My Page");
    expect(meta.openGraph?.title).toBe("My Page");
    expect(meta.twitter?.title).toBe("My Page");
  });

  it("sets description across all fields", () => {
    const meta = ogMeta("Title", "Some description");
    expect(meta.description).toBe("Some description");
    expect(meta.openGraph?.description).toBe("Some description");
    expect(meta.twitter?.description).toBe("Some description");
  });

  it("leaves description undefined when not provided", () => {
    const meta = ogMeta("Title");
    expect(meta.description).toBeUndefined();
    expect(meta.openGraph?.description).toBeUndefined();
  });

  it("handles null description", () => {
    const meta = ogMeta("Title", null);
    expect(meta.description).toBeUndefined();
  });

  it("strips markdown from description", () => {
    const meta = ogMeta("Title", "**bold** text");
    expect(meta.description).toBe("bold text");
  });
});

describe("notFoundMeta", () => {
  it("has the canonical not-found title", () => {
    expect(notFoundMeta.title).toBe("Page Not Found");
  });
});
