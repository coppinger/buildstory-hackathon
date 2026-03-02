import { describe, it, expect } from "vitest";
import { renderMarkdown, stripMarkdown } from "@/lib/markdown";

describe("renderMarkdown", () => {
  it("renders bold with **", () => {
    expect(renderMarkdown("hello **world**")).toBe("hello <strong>world</strong>");
  });

  it("renders bold with __", () => {
    expect(renderMarkdown("hello __world__")).toBe("hello <strong>world</strong>");
  });

  it("renders italic with *", () => {
    expect(renderMarkdown("hello *world*")).toBe("hello <em>world</em>");
  });

  it("renders italic with _", () => {
    expect(renderMarkdown("hello _world_")).toBe("hello <em>world</em>");
  });

  it("renders strikethrough", () => {
    expect(renderMarkdown("hello ~~world~~")).toBe("hello <s>world</s>");
  });

  it("renders links with http", () => {
    expect(renderMarkdown("[click](http://example.com)")).toBe(
      '<a href="http://example.com" target="_blank" rel="noopener noreferrer">click</a>'
    );
  });

  it("renders links with https", () => {
    expect(renderMarkdown("[click](https://example.com)")).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">click</a>'
    );
  });

  it("does not corrupt formatting markers inside URLs", () => {
    const output = renderMarkdown("[link](https://example.com?q=*test*)");
    expect(output).toContain('href="https://example.com?q=*test*"');
    expect(output).not.toContain("<em>");
  });

  it("renders line breaks", () => {
    expect(renderMarkdown("hello\nworld")).toBe("hello<br />world");
  });

  it("collapses multiple consecutive line breaks into one", () => {
    expect(renderMarkdown("hello\n\n\nworld")).toBe("hello<br />world");
    expect(renderMarkdown("a\n\n\n\n\nb")).toBe("a<br />b");
  });

  it("handles combined formatting", () => {
    const input = "**bold** and *italic* and ~~struck~~";
    const output = renderMarkdown(input);
    expect(output).toBe("<strong>bold</strong> and <em>italic</em> and <s>struck</s>");
  });

  // XSS prevention
  it("escapes HTML script tags", () => {
    const output = renderMarkdown("<script>alert(1)</script>");
    expect(output).not.toContain("<script>");
    expect(output).toContain("&lt;script&gt;");
  });

  it("escapes HTML in bold markers", () => {
    const output = renderMarkdown("**<img src=x onerror=alert(1)>**");
    expect(output).not.toContain("<img");
    expect(output).toContain("&lt;img");
  });

  it("rejects javascript: URLs in links", () => {
    const output = renderMarkdown("[click](javascript:alert(1))");
    expect(output).not.toContain("href=\"javascript:");
    // Should leave the markdown syntax as-is (escaped)
    expect(output).toContain("[click]");
  });

  it("rejects data: URLs in links", () => {
    const output = renderMarkdown("[click](data:text/html,<script>alert(1)</script>)");
    expect(output).not.toContain("href=\"data:");
  });

  it("rejects javascript: URLs with mixed case", () => {
    const output = renderMarkdown("[click](JavaScript:alert(1))");
    expect(output).not.toContain("<a ");
  });

  it("rejects vbscript: URLs", () => {
    const output = renderMarkdown("[click](vbscript:MsgBox)");
    expect(output).not.toContain("<a ");
  });

  it("does not allow attribute injection via URL with encoded quotes", () => {
    const output = renderMarkdown('[click](https://evil.com"onmouseover="alert(1))');
    // The " gets escaped to &quot; which doesn't break the attribute boundary
    // So onmouseover stays inside the href value, never becomes a real attribute
    expect(output).toContain('&quot;');
    expect(output).not.toMatch(/\sonmouseover=/);
  });

  it("escapes quotes in regular text", () => {
    const output = renderMarkdown('He said "hello" & \'bye\'');
    expect(output).toContain("&quot;");
    expect(output).toContain("&#39;");
  });

  // Edge cases
  it("handles empty string", () => {
    expect(renderMarkdown("")).toBe("");
  });

  it("handles text with no markdown", () => {
    expect(renderMarkdown("just plain text")).toBe("just plain text");
  });

  it("does not render italic for underscores inside words", () => {
    // e.g. snake_case_variable should not italicize
    expect(renderMarkdown("my_var_name")).toBe("my_var_name");
  });
});

describe("stripMarkdown", () => {
  it("strips bold **markers**", () => {
    expect(stripMarkdown("hello **world**")).toBe("hello world");
  });

  it("strips bold __markers__", () => {
    expect(stripMarkdown("hello __world__")).toBe("hello world");
  });

  it("strips italic *markers*", () => {
    expect(stripMarkdown("hello *world*")).toBe("hello world");
  });

  it("strips strikethrough", () => {
    expect(stripMarkdown("hello ~~world~~")).toBe("hello world");
  });

  it("strips links, keeping text", () => {
    expect(stripMarkdown("check [this](https://example.com) out")).toBe(
      "check this out"
    );
  });

  it("collapses line breaks to spaces", () => {
    expect(stripMarkdown("hello\nworld")).toBe("hello world");
  });

  it("handles combined formatting", () => {
    const input = "**bold** and *italic* [link](https://x.com)\nline two";
    expect(stripMarkdown(input)).toBe("bold and italic link line two");
  });

  it("handles empty string", () => {
    expect(stripMarkdown("")).toBe("");
  });

  it("handles plain text", () => {
    expect(stripMarkdown("no formatting here")).toBe("no formatting here");
  });
});
