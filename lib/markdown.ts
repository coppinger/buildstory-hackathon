/**
 * Lightweight markdown renderer for user-generated content (bios, descriptions).
 * Supports: **bold**, *italic*, ~~strikethrough~~, [links](url), line breaks.
 * XSS strategy: HTML-escape first, then apply regex — only tags we create exist in output.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isAllowedUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Render a plain-text string with basic markdown into safe HTML.
 * Only produces `<strong>`, `<em>`, `<s>`, `<a>`, and `<br />` tags.
 */
export function renderMarkdown(text: string): string {
  let html = escapeHtml(text);

  // Extract links into placeholders so formatting regexes don't corrupt URLs
  // (e.g. *test* inside a query string becoming <em>test</em>)
  const links: string[] = [];
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, (_match, linkText, url) => {
    const decoded = url
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    let replacement: string;
    if (isAllowedUrl(decoded)) {
      replacement = `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
    } else {
      replacement = `[${linkText}](${url})`;
    }
    links.push(replacement);
    return `\x00LINK${links.length - 1}\x00`;
  });

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Italic: *text* or _text_ (but not inside bold markers, which are already replaced)
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/(?<![a-zA-Z0-9])_(.+?)_(?![a-zA-Z0-9])/g, "<em>$1</em>");

  // Strikethrough: ~~text~~
  html = html.replace(/~~(.+?)~~/g, "<s>$1</s>");

  // Restore links from placeholders
  html = html.replace(/\x00LINK(\d+)\x00/g, (_match, index) => links[Number(index)]);

  // Collapse 2+ consecutive line breaks into a single one, then convert to <br />
  html = html.replace(/\n{2,}/g, "\n");
  html = html.replace(/\n/g, "<br />");

  return html;
}

/**
 * Strip markdown syntax from text, returning plain text.
 * Useful for list/card views where line-clamp needs clean text.
 */
export function stripMarkdown(text: string): string {
  let plain = text;

  // Links: [text](url) → text
  plain = plain.replace(/\[(.+?)\]\(.+?\)/g, "$1");

  // Bold
  plain = plain.replace(/\*\*(.+?)\*\*/g, "$1");
  plain = plain.replace(/__(.+?)__/g, "$1");

  // Italic
  plain = plain.replace(/\*(.+?)\*/g, "$1");
  plain = plain.replace(/(?<![a-zA-Z0-9])_(.+?)_(?![a-zA-Z0-9])/g, "$1");

  // Strikethrough
  plain = plain.replace(/~~(.+?)~~/g, "$1");

  // Collapse line breaks into spaces
  plain = plain.replace(/\n+/g, " ");

  return plain.trim();
}
