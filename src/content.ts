import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export interface Article {
  slug: string;
  title: string;
  category: string;
  tags: string[];
  author: string;
  authorRole?: string;
  readTime: number;
  tag: string;
  illustration: string;
  date: string;
  excerpt: string;
  featured: boolean;
  free: boolean;
  highlights: string[];
  body: string;
}

function parseFrontmatter(raw: string): { meta: Record<string, any>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const meta: Record<string, any> = {};
  let currentKey = "";
  let inArray = false;
  const arrayItems: string[] = [];

  for (const line of match[1].split("\n")) {
    if (inArray) {
      const itemMatch = line.match(/^\s+-\s+"(.+)"$/) || line.match(/^\s+-\s+(.+)$/);
      if (itemMatch) {
        arrayItems.push(itemMatch[1]);
        continue;
      } else {
        meta[currentKey] = [...arrayItems];
        arrayItems.length = 0;
        inArray = false;
      }
    }

    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      const [, key, val] = kvMatch;
      if (val === "") {
        currentKey = key;
        inArray = true;
        continue;
      }
      let parsed: any = val.replace(/^["']|["']$/g, "");
      if (parsed === "true") parsed = true;
      else if (parsed === "false") parsed = false;
      else if (/^\d+$/.test(parsed)) parsed = parseInt(parsed, 10);
      meta[key] = parsed;
    }
  }

  if (inArray) {
    meta[currentKey] = [...arrayItems];
  }

  return { meta, body: match[2].trim() };
}

// ── Markdown → HTML ────────────────────────────────────────────

export function markdownToHtml(md: string): string {
  // Extract fenced code blocks first, replace with placeholders
  const codeBlocks: string[] = [];
  let processed = md.replace(/^```(\w*)\n([\s\S]*?)\n```$/gm, (_m, lang, code) => {
    const idx = codeBlocks.length;
    const langAttr = lang ? ` class="language-${lang}"` : "";
    const escaped = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    codeBlocks.push(`<pre><code${langAttr}>${escaped}</code></pre>`);
    return `%%CODEBLOCK_${idx}%%`;
  });

  // Headings h6→h1 (reverse order to avoid ## matching before ###)
  processed = processed.replace(/^###### (.+)$/gm, '<h6 class="article-h6">$1</h6>');
  processed = processed.replace(/^##### (.+)$/gm, '<h5 class="article-h5">$1</h5>');
  processed = processed.replace(/^#### (.+)$/gm, '<h4 class="article-h4">$1</h4>');
  processed = processed.replace(/^### (.+)$/gm, '<h3 class="article-h3">$1</h3>');
  processed = processed.replace(/^## (.+)$/gm, '<h2 class="article-h2">$1</h2>');
  processed = processed.replace(/^# (.+)$/gm, '<h1 class="article-h1">$1</h1>');

  // Blockquotes
  processed = processed.replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>");

  // Images (before links — ![alt](src))
  processed = processed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1"/>');

  // Links [text](url)
  processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Bold+italic, bold, italic
  processed = processed.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  processed = processed.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  processed = processed.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Inline code
  processed = processed.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Process blocks
  const blocks = processed.split(/\n\n+/);
  const output: string[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Code block placeholder
    if (/^%%CODEBLOCK_\d+%%$/.test(trimmed)) {
      output.push(trimmed);
      continue;
    }

    // Already HTML tag
    if (trimmed.startsWith("<")) {
      output.push(trimmed);
      continue;
    }

    // Unordered list
    const lines = trimmed.split("\n");
    if (lines.every((l) => /^- /.test(l))) {
      const items = lines.map((l) => `<li class="article-li-ul">${l.slice(2).trim()}</li>`).join("\n");
      output.push(`<ul class="article-ul">\n${items}\n</ul>`);
      continue;
    }

    // Ordered list
    if (lines.every((l) => /^\d+\. /.test(l))) {
      const items = lines.map((l) => `<li class="article-li">${l.replace(/^\d+\.\s*/, "").trim()}</li>`).join("\n");
      output.push(`<ol class="article-ol">\n${items}\n</ol>`);
      continue;
    }

    // Paragraph
    output.push(`<p class="article-p">${trimmed.replace(/\n/g, " ")}</p>`);
  }

  let html = output.join("\n");

  // Restore code blocks
  html = html.replace(/%%CODEBLOCK_(\d+)%%/g, (_m, idx) => codeBlocks[parseInt(idx)]);

  return html;
}

// ── Sanitization ───────────────────────────────────────────────

export function sanitizeHtml(html: string): string {
  // Strip script tags and event handlers
  let safe = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  safe = safe.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
  return safe;
}

// ── Article Loading ────────────────────────────────────────────

const CONTENT_DIR = join(import.meta.dir, "..", "content", "articles");

export async function loadArticles(): Promise<Article[]> {
  let dirs: string[];
  try {
    dirs = await readdir(CONTENT_DIR);
  } catch {
    return [];
  }

  const articles: Article[] = [];

  for (const slug of dirs) {
    const filePath = join(CONTENT_DIR, slug, "index.md");
    try {
      const raw = await readFile(filePath, "utf-8");
      const { meta, body } = parseFrontmatter(raw);

      // Parse tags from comma-separated or YAML array
      let tags: string[] = [];
      if (Array.isArray(meta.tags)) {
        tags = meta.tags;
      } else if (typeof meta.tags === "string") {
        tags = meta.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
      }

      articles.push({
        slug: meta.slug || slug,
        title: meta.title || slug,
        category: meta.category || "",
        tags,
        author: meta.author || "",
        authorRole: meta.authorRole,
        readTime: meta.readTime || 5,
        tag: meta.tag || "",
        illustration: meta.illustration || "",
        date: meta.date || "",
        excerpt: meta.excerpt || "",
        featured: meta.featured === true,
        free: meta.free === true,
        highlights: meta.highlights || [],
        body: sanitizeHtml(markdownToHtml(body)),
      });
    } catch {
      console.warn(`[content] Skipping ${slug}: no index.md or parse error`);
    }
  }

  articles.sort((a, b) => (b.date > a.date ? 1 : -1));
  return articles;
}

export async function loadArticle(slug: string): Promise<Article | null> {
  const articles = await loadArticles();
  return articles.find((a) => a.slug === slug) || null;
}
