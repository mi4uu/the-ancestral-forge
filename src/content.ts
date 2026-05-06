import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export interface Article {
  slug: string;
  title: string;
  category: string;
  author: string;
  authorRole?: string;
  readTime: number;
  tag: string;
  illustration: string;
  date: string;
  excerpt: string;
  featured?: boolean;
  highlights?: string[];
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
        // could be start of array on next lines
        currentKey = key;
        inArray = true;
        continue;
      }
      // strip quotes
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

function markdownToHtml(md: string): string {
  let html = md;

  // headings
  html = html.replace(/^### (.+)$/gm, '<h3 class="article-h3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="article-h2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="article-h1">$1</h1>');

  // bold & italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // ordered lists
  html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<li class="article-li">$2</li>');

  // unordered lists
  html = html.replace(/^-\s+(.+)$/gm, '<li class="article-li-ul">$1</li>');

  // wrap consecutive <li> in <ol>/<ul>
  html = html.replace(
    /(<li class="article-li">[\s\S]*?<\/li>\n?)+/g,
    (m) => `<ol class="article-ol">${m}</ol>`
  );
  html = html.replace(
    /(<li class="article-li-ul">[\s\S]*?<\/li>\n?)+/g,
    (m) => `<ul class="article-ul">${m}</ul>`
  );

  // paragraphs — wrap remaining non-tag lines
  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<")) return trimmed;
      return `<p class="article-p">${trimmed.replace(/\n/g, " ")}</p>`;
    })
    .join("\n");

  return html;
}

const CONTENT_DIR = join(import.meta.dir, "..", "content", "articles");

export async function loadArticles(): Promise<Article[]> {
  const dirs = await readdir(CONTENT_DIR);
  const articles: Article[] = [];

  for (const slug of dirs) {
    const filePath = join(CONTENT_DIR, slug, "index.md");
    try {
      const raw = await readFile(filePath, "utf-8");
      const { meta, body } = parseFrontmatter(raw);
      articles.push({
        slug,
        title: meta.title || slug,
        category: meta.category || "",
        author: meta.author || "",
        authorRole: meta.authorRole,
        readTime: meta.readTime || 5,
        tag: meta.tag || "",
        illustration: meta.illustration || "",
        date: meta.date || "",
        excerpt: meta.excerpt || "",
        featured: meta.featured || false,
        highlights: meta.highlights || [],
        body: markdownToHtml(body),
      });
    } catch {
      // skip dirs without index.md
    }
  }

  articles.sort((a, b) => (b.date > a.date ? 1 : -1));
  return articles;
}

export async function loadArticle(slug: string): Promise<Article | null> {
  const articles = await loadArticles();
  return articles.find((a) => a.slug === slug) || null;
}
