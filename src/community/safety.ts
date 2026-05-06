/**
 * Content safety — XSS prevention for user-generated content.
 * Strategy: escape HTML first, then linkify URLs in safe text.
 */

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};

const ESCAPE_RE = /[&<>"']/g;

export function escapeHtml(input: string): string {
  return input.replace(ESCAPE_RE, (ch) => ESCAPE_MAP[ch]!);
}

export function linkify(escapedText: string): string {
  return escapedText.replace(
    /https?:\/\/[^\s<>&"']+/g,
    (url) => `<a href="${url}" target="_blank" rel="noopener">${url}</a>`,
  );
}

export function sanitizeComment(body: string): string {
  return linkify(escapeHtml(body));
}

export function sanitizeDisplayName(name: string): string {
  return escapeHtml(name);
}
