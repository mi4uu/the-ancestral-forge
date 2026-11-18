import { reverse, lookup } from "node:dns/promises";
import type { Article } from "./content";
import { getConfig } from "./config";

const cfg = getConfig();

export const PAYWALL_SELECTOR = ".paywalled-content";
export const INDEXNOW_KEY = "14f41ddc80034fe7e3666cdd63395294";
export const DEFAULT_OG_IMAGE = "/images/logo.png";

export function absUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return cfg.url + (path.startsWith("/") ? path : `/${path}`);
}

export function escAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function jsonLdScript(obj: unknown): string {
  const json = JSON.stringify(obj).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
  return `<script type="application/ld+json">${json}</script>`;
}

const publisher = () => ({
  "@type": "Organization",
  name: cfg.name,
  url: cfg.url,
  logo: { "@type": "ImageObject", url: absUrl(DEFAULT_OG_IMAGE) },
});

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: cfg.name,
    url: cfg.url + "/",
    description: cfg.description,
    publisher: publisher(),
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${cfg.url}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function articleJsonLd(a: Article, gated: boolean) {
  const url = absUrl(`/articles/${a.slug}`);
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: a.title.slice(0, 110),
    description: a.excerpt,
    image: [absUrl(a.heroImage || DEFAULT_OG_IMAGE)],
    author: { "@type": "Person", name: a.author, ...(a.authorRole ? { jobTitle: a.authorRole } : {}) },
    datePublished: a.date,
    dateModified: a.date,
    publisher: publisher(),
    articleSection: cfg.categories.find((c) => c.slug === a.category)?.name || a.category,
    keywords: a.tags.join(", "),
    isAccessibleForFree: !gated,
  };
  if (gated) {
    ld.hasPart = { "@type": "WebPageElement", isAccessibleForFree: false, cssSelector: PAYWALL_SELECTOR };
  }
  return ld;
}

export function relatedArticles(article: Article, all: Article[], limit = 4): Article[] {
  const tags = new Set(article.tags);
  return all
    .filter((a) => a.slug !== article.slug)
    .map((a) => ({
      a,
      score: (a.category === article.category ? 3 : 0) + a.tags.filter((t) => tags.has(t)).length * 2,
    }))
    .filter((s) => s.score > 0)
    .sort((x, y) => y.score - x.score || (y.a.date > x.a.date ? 1 : -1))
    .slice(0, limit)
    .map((s) => s.a);
}

// ── Verified search crawlers ─────────────────────────────────────
// A user agent proves nothing. A crawler counts only if its IP reverse-resolves
// to the engine's own domain and that hostname resolves forward to the same IP.

const BOTS: { ua: RegExp; host: RegExp }[] = [
  { ua: /Googlebot/i, host: /\.(googlebot|google)\.com$/ },
  { ua: /bingbot/i, host: /\.search\.msn\.com$/ },
];

const POSITIVE_TTL = 24 * 60 * 60 * 1000;
const NEGATIVE_TTL = 60 * 60 * 1000;
const MAX_CACHE = 5000;
const cache = new Map<string, { ok: boolean; exp: number }>();

export function clientIp(headers: Record<string, string | undefined>): string | null {
  const raw = headers["cf-connecting-ip"] || headers["x-forwarded-for"]?.split(",")[0] || "";
  const ip = raw.trim();
  return ip || null;
}

export async function isVerifiedSearchBot(ip: string | null, ua: string | undefined): Promise<boolean> {
  if (!ip || !ua) return false;
  const bot = BOTS.find((b) => b.ua.test(ua));
  if (!bot) return false;

  const key = `${bot.ua.source}|${ip}`;
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return hit.ok;

  let ok = false;
  try {
    const timeout = <T>(p: Promise<T>) =>
      Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error("dns timeout")), 3000))]);
    const names = await timeout(reverse(ip));
    for (const name of names) {
      if (!bot.host.test(name.toLowerCase())) continue;
      const fwd = await timeout(lookup(name, { all: true }));
      if (fwd.some((f) => f.address === ip)) {
        ok = true;
        break;
      }
    }
  } catch {
    ok = false;
  }

  if (cache.size >= MAX_CACHE) cache.clear();
  cache.set(key, { ok, exp: Date.now() + (ok ? POSITIVE_TTL : NEGATIVE_TTL) });
  return ok;
}
