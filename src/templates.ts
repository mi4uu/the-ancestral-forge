import type { Article } from "./content";
import { getIllustration } from "./illustrations";
import { getConfig } from "./config";
import type { UserContext } from "./auth/middleware";
import type { Comment } from "./community/storage";
import { sanitizeComment, sanitizeDisplayName } from "./community/safety";
import { isArticleGated, canUserAccessArticle } from "./vault/paywall";
import { absUrl, escAttr, jsonLdScript, websiteJsonLd, articleJsonLd, relatedArticles, DEFAULT_OG_IMAGE, PAYWALL_SELECTOR } from "./seo";

const cfg = getConfig();
const P = cfg.palette;
const FONT = cfg.typography.heading;

interface SeoMeta {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  path?: string;
  type?: "website" | "article";
  jsonLd?: unknown[];
  noindex?: boolean;
  publishedTime?: string;
}

function head(titleOrMeta: string | SeoMeta) {
  const meta: SeoMeta = typeof titleOrMeta === "string" ? { title: titleOrMeta } : titleOrMeta;
  const desc = meta.description || cfg.description;
  const ogTitle = meta.ogTitle || meta.title;
  const ogDesc = meta.ogDescription || desc;
  const ogImage = absUrl(meta.ogImage || DEFAULT_OG_IMAGE);
  const canonical = meta.path !== undefined ? absUrl(meta.path) : "";
  const e = escAttr;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-715YXLJX2J"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-715YXLJX2J');</script>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${meta.title}</title>
<meta name="description" content="${e(desc)}"/>
${meta.noindex ? `<meta name="robots" content="noindex,follow"/>\n` : ""}${canonical ? `<link rel="canonical" href="${e(canonical)}"/>\n<meta property="og:url" content="${e(canonical)}"/>\n` : ""}<meta property="og:site_name" content="${e(cfg.name)}"/>
<meta property="og:type" content="${meta.type || "website"}"/>
<meta property="og:title" content="${e(ogTitle)}"/>
<meta property="og:description" content="${e(ogDesc)}"/>
<meta property="og:image" content="${e(ogImage)}"/>
${meta.publishedTime ? `<meta property="article:published_time" content="${e(meta.publishedTime)}"/>\n` : ""}<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${e(ogTitle)}"/>
<meta name="twitter:description" content="${e(ogDesc)}"/>
<meta name="twitter:image" content="${e(ogImage)}"/>
${(meta.jsonLd || []).map(jsonLdScript).join("\n")}
<link rel="alternate" type="application/rss+xml" title="${cfg.name}" href="/rss"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;0,800;0,900;1,400;1,500;1,700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Merriweather:ital,wght@0,400;0,700;0,900;1,400&display=swap" rel="stylesheet"/>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { margin: 0; padding: 0; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; background: ${P.bg}; color: ${P.ink}; }
  .font-serif { font-family: ${FONT}; }
  ::selection { background: ${P.gold}; color: ${P.bg}; }
  a { text-decoration: none; color: inherit; }
  a:hover { text-decoration: underline; }

  /* Grain overlay */
  .grain {
    position: fixed; inset: 0; pointer-events: none; z-index: 10;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='4'/><feColorMatrix values='0 0 0 0 0.1  0 0 0 0 0.1  0 0 0 0 0.05  0 0 0 0.5 0'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.4'/></svg>");
    mix-blend-mode: multiply; opacity: 0.35;
  }

  /* Nav */
  .nav-header { position: sticky; top: 0; z-index: 30; background: ${P.bg}; border-bottom: 1px solid ${P.ink}; }
  .nav-eyebrow { display: flex; justify-content: space-between; align-items: center; padding: 6px 32px; font-size: 10px; letter-spacing: 0.18em; color: ${P.muted}; border-bottom: 1px solid ${P.ink}33; }
  .nav-main { display: flex; align-items: center; justify-content: space-between; padding: 0 32px; min-height: 80px; }
  .nav-logo { display: flex; align-items: center; gap: 16px; text-decoration: none; position: relative; }
  .nav-logo img { border-radius: 0; display: block; position: absolute; left: 0; }
  .nav-logo span { font-family: ${FONT}; font-weight: 700; letter-spacing: 0.22em; font-size: 15px; color: ${P.ink}; padding-left: 120px; }
  .nav-links { display: flex; align-items: center; gap: 40px; font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; }
  .nav-links a { position: relative; color: ${P.ink}; text-decoration: none; padding: 4px 0; }
  .nav-links a::after { content: ''; position: absolute; left: 0; right: 0; bottom: -2px; height: 1px; background: ${P.gold}; transform: scaleX(0); transform-origin: left; transition: transform 250ms; }
  .nav-links a:hover::after { transform: scaleX(1); }
  .nav-links a:hover { text-decoration: none; }
  .nav-actions { display: flex; align-items: center; gap: 16px; }
  .btn-vault { padding: 10px 20px; font-size: 12px; letter-spacing: 0.22em; font-weight: 700; text-transform: uppercase; background: ${P.deep}; color: ${P.bg}; border: 1px solid ${P.deep}; box-shadow: 2px 2px 0 ${P.gold}; text-decoration: none; transition: transform 100ms; }
  .btn-vault:hover { transform: translateY(-1px); text-decoration: none; }
  .btn-search { padding: 6px; color: ${P.ink}; background: none; border: none; cursor: pointer; }

  /* Hero */
  .hero { padding: 40px 32px 48px; border-bottom: 1px solid ${P.ink}; }
  .hero-inner { max-width: 1500px; margin: 0 auto; }
  .hero-breadcrumb { display: flex; align-items: center; gap: 16px; font-size: 10px; letter-spacing: 0.32em; color: ${P.muted}; margin-bottom: 24px; }
  .hero-breadcrumb .line { flex: 1; height: 1px; background: ${P.ink}; opacity: 0.4; }
  .hero h1 { font-family: ${FONT}; font-weight: 900; line-height: 0.92; letter-spacing: -0.02em; margin-bottom: 32px; font-size: clamp(48px, 7vw, 112px); text-wrap: balance; }
  .hero h1 .accent { font-style: italic; font-weight: 500; color: ${P.accent}; }
  .hero-grid { display: grid; grid-template-columns: 7fr 5fr; gap: 32px; padding-top: 32px; border-top: 1px solid ${P.ink}; }
  .hero-img-wrap { position: relative; border: 1px solid ${P.ink}; }
  .hero-img-wrap svg { display: block; width: 100%; height: 520px; }
  .hero-img-wrap img { display: block; width: 100%; height: 520px; object-fit: cover; }
  .hero-stamp { position: absolute; top: 16px; left: 16px; padding: 4px 12px; font-size: 10px; letter-spacing: 0.3em; font-weight: 700; text-transform: uppercase; background: ${P.deep}; color: ${P.bg}; }
  .hero-plate { position: absolute; bottom: 0; left: 0; right: 0; padding: 8px 16px; font-size: 10px; letter-spacing: 0.25em; display: flex; justify-content: space-between; background: ${P.bg}; border-top: 1px solid ${P.ink}; color: ${P.muted}; }
  .hero-article { display: flex; flex-direction: column; }
  .hero-cat { display: flex; align-items: baseline; gap: 12px; margin-bottom: 20px; }
  .hero-cat-label { font-size: 11px; letter-spacing: 0.3em; font-weight: 700; color: ${P.gold}; }
  .hero-cat .line { flex: 1; height: 1px; background: ${P.ink}; opacity: 0.3; }
  .hero-cat-read { font-size: 10px; letter-spacing: 0.25em; color: ${P.muted}; }
  .hero-article h2 { font-family: ${FONT}; font-weight: 800; line-height: 1.02; margin-bottom: 20px; font-size: clamp(32px, 3.5vw, 52px); text-wrap: balance; }
  .hero-article h2 em { font-weight: 500; }
  .hero-excerpt { font-size: 17px; line-height: 1.55; margin-bottom: 20px; }
  .hero-dropcap { float: left; margin-right: 12px; margin-top: 4px; font-family: ${FONT}; font-size: 76px; line-height: 0.85; color: ${P.accent}; }
  .hero-highlights { font-size: 13px; color: ${P.muted}; margin-bottom: 24px; list-style: none; }
  .hero-highlights li { display: flex; gap: 12px; padding: 6px 0; }
  .hero-highlights li + li { border-top: 1px dashed ${P.ink}33; }
  .hero-highlights .num { font-weight: 700; font-variant-numeric: tabular-nums; color: ${P.gold}; }
  .hero-cta { display: flex; align-items: center; gap: 16px; margin-top: auto; padding-top: 16px; border-top: 1px solid ${P.ink}; }
  .btn-dispatch { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; font-size: 12px; letter-spacing: 0.22em; font-weight: 700; text-transform: uppercase; background: ${P.ink}; color: ${P.bg}; box-shadow: 2px 2px 0 ${P.gold}; text-decoration: none; }
  .btn-dispatch:hover { text-decoration: none; }
  .hero-byline { font-size: 11px; color: ${P.muted}; }
  .hero-byline strong { color: ${P.ink}; font-weight: 600; display: block; }

  /* Transmissions grid */
  .transmissions { padding: 64px 32px; border-bottom: 1px solid ${P.ink}; }
  .transmissions-inner { max-width: 1500px; margin: 0 auto; }
  .section-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 40px; padding-bottom: 16px; border-bottom: 2px solid ${P.ink}; }
  .section-tag { display: flex; align-items: center; gap: 12px; font-size: 10px; letter-spacing: 0.32em; color: ${P.gold}; margin-bottom: 12px; }
  .section-head h2 { font-family: ${FONT}; font-weight: 800; font-size: clamp(36px, 5vw, 64px); line-height: 1; }
  .section-head .sub { margin-top: 12px; font-style: italic; font-size: 14px; color: ${P.muted}; font-family: ${FONT}; }
  .section-head .view-all { font-size: 11px; letter-spacing: 0.22em; color: ${P.ink}; font-weight: 600; text-decoration: none; }
  .section-head .view-all:hover { text-decoration: underline; }
  .cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); }
  .card { display: flex; flex-direction: column; padding: 0 28px; cursor: pointer; transition: background 200ms; }
  .card:hover { background: ${P.ink}06; }
  .card + .card { border-left: 1px solid ${P.ink}; }
  .card-cat { display: flex; align-items: center; gap: 12px; font-size: 10px; letter-spacing: 0.32em; font-weight: 700; color: ${P.gold}; margin-bottom: 16px; }
  .card-img { position: relative; margin-bottom: 20px; border: 1px solid ${P.ink}; }
  .card-img svg { display: block; width: 100%; height: 220px; }
  .card-img img { display: block; width: 100%; height: 220px; object-fit: cover; }
  .card-tag { position: absolute; top: 12px; right: 12px; padding: 5px 12px; font-size: 10px; letter-spacing: 0.2em; font-weight: 700; background: ${P.bg}; border: 1.5px solid ${P.ink}; color: ${P.ink}; display: none; }
  .card h3 { font-family: ${FONT}; font-weight: 800; font-size: 28px; line-height: 1.05; margin-bottom: 12px; text-wrap: balance; }
  .card h3 a { text-decoration: none; }
  .card h3 a:hover { text-decoration: underline; }
  .card p { font-size: 14px; line-height: 1.55; color: ${P.ink}CC; margin-bottom: 20px; }
  .card-meta { margin-top: auto; display: flex; align-items: center; justify-content: space-between; padding-top: 16px; font-size: 11px; letter-spacing: 0.18em; border-top: 1px dashed ${P.ink}55; color: ${P.muted}; }
  .card-meta strong { color: ${P.ink}; font-weight: 600; }

  /* Secondary rail */
  .secondary { padding: 64px 32px; border-bottom: 1px solid ${P.ink}; background: ${P.paper}; }
  .secondary-inner { max-width: 1500px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; border: 1px solid ${P.ink}; }
  .secondary-item { display: grid; grid-template-columns: 1fr 1fr; }
  .secondary-item + .secondary-item { border-left: 1px solid ${P.ink}; }
  .secondary-img { border-right: 1px solid ${P.ink}; }
  .secondary-img svg { display: block; width: 100%; height: 100%; min-height: 260px; }
  .secondary-img img { display: block; width: 100%; height: 100%; min-height: 260px; object-fit: cover; }
  .secondary-text { padding: 28px; display: flex; flex-direction: column; }
  .secondary-text .cat { display: flex; align-items: center; gap: 10px; font-size: 10px; letter-spacing: 0.3em; font-weight: 700; color: ${P.gold}; margin-bottom: 12px; }
  .secondary-text h3 { font-family: ${FONT}; font-weight: 800; font-size: 24px; line-height: 1.05; margin-bottom: 12px; text-wrap: balance; }
  .secondary-text h3 a { text-decoration: none; }
  .secondary-text h3 a:hover { text-decoration: underline; }
  .secondary-text p { font-size: 13px; line-height: 1.55; color: ${P.ink}CC; margin-bottom: 16px; }
  .secondary-text .byline { margin-top: auto; font-size: 11px; letter-spacing: 0.2em; color: ${P.muted}; }
  .secondary-text .byline strong { color: ${P.ink}; font-weight: 600; }

  /* Access badges */
  .badge-members { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; font-size: 10px; letter-spacing: 0.18em; font-weight: 700; text-transform: uppercase; background: ${P.deep}; color: ${P.gold}; white-space: nowrap; vertical-align: middle; }
  .badge-free { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; font-size: 10px; letter-spacing: 0.18em; font-weight: 700; text-transform: uppercase; background: transparent; color: #5a7a5a; border: 1.5px solid #5a7a5a55; white-space: nowrap; vertical-align: middle; }

  /* Archive grid */
  .archive { padding: 64px 32px; border-bottom: 1px solid ${P.ink}; }
  .archive-inner { max-width: 1500px; margin: 0 auto; }
  .archive-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }
  .archive-item { display: flex; gap: 16px; padding: 20px 24px; border-bottom: 1px dashed ${P.ink}33; cursor: pointer; transition: background 200ms; }
  .archive-item:hover { background: ${P.ink}06; }
  .archive-item:nth-child(-n+4) { border-top: 1px solid ${P.ink}; }
  .archive-item:nth-child(4n+1) { border-right: 1px solid ${P.ink}22; }
  .archive-item:nth-child(4n+2) { border-right: 1px solid ${P.ink}22; }
  .archive-item:nth-child(4n+3) { border-right: 1px solid ${P.ink}22; }
  .archive-thumb { flex-shrink: 0; width: 80px; height: 80px; border: 1px solid ${P.ink}33; overflow: hidden; }
  .archive-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .archive-thumb svg { width: 100%; height: 100%; }
  .archive-text { display: flex; flex-direction: column; min-width: 0; }
  .archive-text .cat { display: flex; align-items: center; gap: 8px; font-size: 9px; letter-spacing: 0.3em; font-weight: 700; color: ${P.gold}; margin-bottom: 4px; }
  .archive-text h4 { font-family: ${FONT}; font-weight: 700; font-size: 15px; line-height: 1.15; margin-bottom: 4px; }
  .archive-text h4 a { text-decoration: none; }
  .archive-text h4 a:hover { text-decoration: underline; }
  .archive-text .meta { font-size: 10px; letter-spacing: 0.18em; color: ${P.muted}; margin-top: auto; }

  /* Newsletter */
  .newsletter { position: relative; padding: 96px 32px; overflow: hidden; background: ${P.deep}; color: ${P.bg}; text-align: center; }
  .newsletter svg.rays { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.07; pointer-events: none; }
  .newsletter-inner { position: relative; max-width: 768px; margin: 0 auto; }
  .newsletter .tag { font-size: 10px; letter-spacing: 0.4em; color: ${P.gold}; margin-bottom: 24px; }
  .newsletter h2 { font-family: ${FONT}; font-weight: 800; font-size: clamp(48px, 7vw, 96px); line-height: 0.95; margin-bottom: 24px; text-wrap: balance; }
  .newsletter h2 em { font-weight: 500; color: ${P.gold}; }
  .newsletter .desc { font-size: 18px; line-height: 1.55; margin-bottom: 40px; max-width: 560px; margin-left: auto; margin-right: auto; color: ${P.bg}CC; }
  .newsletter form { max-width: 560px; margin: 0 auto; }
  .newsletter .form-row { display: flex; border: 1px solid ${P.bg}; }
  .newsletter input[type="email"] { flex: 1; background: transparent; padding: 16px 20px; border: none; outline: none; color: ${P.bg}; font-size: 15px; font-family: ${FONT}; }
  .newsletter input[type="email"]::placeholder { color: ${P.bg}66; }
  .newsletter .btn-sub { padding: 16px 32px; font-size: 12px; letter-spacing: 0.25em; font-weight: 700; text-transform: uppercase; background: ${P.gold}; color: ${P.deep}; border: none; border-left: 1px solid ${P.deep}; cursor: pointer; }
  .newsletter .trust { margin-top: 20px; display: flex; justify-content: center; gap: 24px; font-size: 10px; letter-spacing: 0.25em; color: ${P.bg}99; }

  /* Footer */
  .footer { padding: 56px 32px; background: ${P.bg}; border-top: 1px solid ${P.ink}; }
  .footer-inner { max-width: 1500px; margin: 0 auto; }
  .footer-grid { display: grid; grid-template-columns: 5fr 2fr 2fr 2fr 1fr; gap: 40px; padding-bottom: 40px; border-bottom: 1px solid ${P.ink}55; }
  .footer-brand { font-family: ${FONT}; font-weight: 700; letter-spacing: 0.2em; font-size: 18px; margin-bottom: 12px; }
  .footer-desc { font-size: 13px; line-height: 1.6; max-width: 400px; font-style: italic; color: ${P.muted}; font-family: ${FONT}; }
  .footer-col-head { font-size: 10px; letter-spacing: 0.3em; font-weight: 700; color: ${P.gold}; margin-bottom: 12px; }
  .footer-col ul { list-style: none; }
  .footer-col li { margin-bottom: 6px; }
  .footer-col a { font-size: 13px; color: ${P.ink}; }
  .footer-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 32px; font-size: 11px; letter-spacing: 0.18em; color: ${P.muted}; flex-wrap: wrap; gap: 24px; }
  .footer-bottom-links { display: flex; gap: 24px; }
  .footer-bottom-links a { color: ${P.muted}; }
  .footer-disclaimer { margin-top: 40px; padding: 20px; font-size: 11px; line-height: 1.6; font-style: italic; background: ${P.paper}; border: 1px solid ${P.ink}33; color: ${P.muted}; font-family: ${FONT}; }
  .footer-disclaimer strong { color: ${P.ink}; font-style: normal; letter-spacing: 0.15em; text-transform: uppercase; font-size: 10px; }

  /* Article page */
  .article-page { max-width: 780px; margin: 0 auto; padding: 48px 32px 96px; }
  .article-meta { font-size: 10px; letter-spacing: 0.3em; color: ${P.gold}; font-weight: 700; margin-bottom: 16px; }
  .article-page > h1 { font-family: ${FONT}; font-weight: 800; font-size: clamp(36px, 5vw, 56px); line-height: 1.05; margin-bottom: 16px; text-wrap: balance; }
  .article-byline { font-size: 13px; color: ${P.muted}; margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid ${P.ink}33; }
  .article-byline strong { color: ${P.ink}; }
  .article-hero-img { margin-bottom: 40px; border: 1px solid ${P.ink}; overflow: hidden; }
  .article-hero-img svg { display: block; width: 100%; height: 400px; }
  .article-hero-img img { display: block; width: 100%; height: auto; }
  .article-page img { display: block; max-width: 100%; height: auto; margin: 32px 0; border: 1px solid ${P.ink}33; }
  .article-h2 { font-family: ${FONT}; font-weight: 800; font-size: 32px; line-height: 1.1; margin: 48px 0 16px; color: ${P.ink}; }
  .article-h3 { font-family: ${FONT}; font-weight: 700; font-size: 24px; line-height: 1.15; margin: 36px 0 12px; color: ${P.ink}; }
  .article-p { font-size: 17px; line-height: 1.7; margin-bottom: 20px; color: ${P.ink}; }
  .article-ol, .article-ul { margin: 16px 0 24px 24px; font-size: 16px; line-height: 1.7; }
  .article-li, .article-li-ul { margin-bottom: 8px; }
  .article-table { width: 100%; border-collapse: collapse; margin: 24px 0 32px; font-size: 15px; line-height: 1.5; }
  .article-table th { text-align: left; padding: 10px 14px; font-weight: 700; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: ${P.muted}; border-bottom: 2px solid ${P.ink}; background: ${P.paper}; }
  .article-table td { padding: 10px 14px; border-bottom: 1px solid ${P.ink}22; }
  .article-table tr:hover td { background: ${P.paper}; }
  .article-hr { border: none; border-top: 1px solid ${P.ink}33; margin: 40px 0; }

  /* Responsive */
  @media (max-width: 1024px) {
    .hero-grid { grid-template-columns: 1fr; }
    .cards-grid { grid-template-columns: 1fr; }
    .card + .card { border-left: none; border-top: 1px solid ${P.ink}; padding-top: 28px; }
    .secondary-inner { grid-template-columns: 1fr; }
    .secondary-item + .secondary-item { border-left: none; border-top: 1px solid ${P.ink}; }
    .archive-grid { grid-template-columns: repeat(2, 1fr); }
    .archive-item:nth-child(4n+1),
    .archive-item:nth-child(4n+2),
    .archive-item:nth-child(4n+3) { border-right: none; }
    .archive-item:nth-child(2n+1) { border-right: 1px solid ${P.ink}22; }
    .nav-links { display: none; }
    .nav-eyebrow .hide-mobile { display: none; }
    .footer-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 640px) {
    .hero, .transmissions, .secondary, .footer { padding-left: 16px; padding-right: 16px; }
    .nav-eyebrow, .nav-main { padding-left: 16px; padding-right: 16px; }
    .newsletter { padding-left: 16px; padding-right: 16px; }
    .archive-grid { grid-template-columns: 1fr; }
    .archive-item:nth-child(2n+1) { border-right: none; }
    .newsletter .form-row { flex-direction: column; }
    .newsletter .btn-sub { border-left: none; border-top: 1px solid ${P.deep}; }
    .secondary-item { grid-template-columns: 1fr; }
    .secondary-img { border-right: none; border-bottom: 1px solid ${P.ink}; }
    .footer-grid { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<div class="grain"></div>`;
}

function newsletterRays(): string {
  const lines: string[] = [];
  for (let i = 0; i < 80; i++) {
    const a = (i * 4.5) * Math.PI / 180;
    lines.push(`<line x1="${800 + Math.cos(a) * 80}" y1="${300 + Math.sin(a) * 80}" x2="${800 + Math.cos(a) * 1200}" y2="${300 + Math.sin(a) * 1200}" stroke="${P.bg}" stroke-width="1"/>`);
  }
  return lines.join("");
}

function accessBadge(a: Article): string {
  if (isArticleGated(a)) return `<span class="badge-members">🔒 Members</span>`;
  return `<span class="badge-free">Free</span>`;
}

function articleImage(a: Article, alt?: string, eager = false): string {
  if (a.heroImage) return `<img src="${a.heroImage}" alt="${alt || a.title}"${eager ? "" : ' loading="lazy"'}/>`;
  return getIllustration(a.illustration);
}

function nav() {
  return `
<header class="nav-header">
  <div class="nav-eyebrow">
    <span>EST. 2026</span>
    <span>SUBSCRIBERS: <span id="sub-count">${cfg.subscriberCountText}</span></span>
  </div>
  <script>(function(){fetch('/api/subscriber-count').then(function(r){return r.json()}).then(function(d){if(!d.display)return;['sub-count','sub-count-nl'].forEach(function(id){var el=document.getElementById(id);if(el)el.textContent=d.display;});}).catch(function(){});})()</script>
  <nav class="nav-main">
    <a href="/" class="nav-logo">
      <img src="/images/logo.png" alt="${cfg.name}" style="height:90px;width:auto;object-fit:contain;bottom:-40px;"/>
      <span>${cfg.name.toUpperCase()}</span>
    </a>
    <div class="nav-links">
      ${cfg.nav.map((n) => `<a href="${n.href}">${n.label}</a>`).join("\n      ")}
    </div>
    <div class="nav-actions">
      <button class="btn-search" aria-label="Search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
          <circle cx="11" cy="11" r="7"/><path d="M 20 20 L 16 16"/>
        </svg>
      </button>
      <a href="/auth/login" class="btn-vault">Unlock the Vault</a>
    </div>
  </nav>
</header>`;
}

function footer() {
  return `
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-grid">
      <div>
        <div class="footer-brand">${cfg.name.toUpperCase()}</div>
        <p class="footer-desc">${cfg.description}</p>
      </div>
      ${cfg.footer.columns.map((col) => `<div class="footer-col">
        <div class="footer-col-head">◆ ${col.heading}</div>
        <ul>${col.links.map((l) => `<li><a href="${l.href}">${l.label}</a></li>`).join("")}</ul>
      </div>`).join("\n      ")}
      <div></div>
    </div>
    <div class="footer-bottom">
      <span>©  ${new Date().getFullYear()}  ${cfg.name.toUpperCase()}.  RECLAIMING  THE  LOST  ARTS.</span>
      <div class="footer-bottom-links">
        <a href="/rss">RSS</a>
      </div>
    </div>
    <div class="footer-disclaimer">
      <strong>Medical Disclaimer  ·  </strong>
      ${cfg.footer.legalDisclaimer}
    </div>
  </div>
</footer>
<div id="cookie-banner" style="display:none;position:fixed;bottom:0;left:0;right:0;z-index:9999;background:${P.deep};color:${P.bg};padding:16px 24px;font-size:13px;line-height:1.5;box-shadow:0 -2px 12px rgba(0,0,0,.3);">
  <div style="max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;">
    <p style="margin:0;flex:1;min-width:280px;">This site uses cookies (Google Analytics) to understand how visitors use our content. By continuing to browse, you consent to cookies. <span style="color:${P.gold};">We use only analytics cookies.</span></p>
    <div style="display:flex;gap:10px;flex-shrink:0;">
      <button onclick="acceptCookies()" style="padding:8px 24px;background:${P.gold};color:${P.deep};border:none;font-size:12px;letter-spacing:0.15em;font-weight:700;text-transform:uppercase;cursor:pointer;">Accept</button>
      <button onclick="declineCookies()" style="padding:8px 24px;background:transparent;color:${P.bg};border:1px solid ${P.bg}55;font-size:12px;letter-spacing:0.15em;font-weight:700;text-transform:uppercase;cursor:pointer;">Decline</button>
    </div>
  </div>
</div>
<script>
(function(){
  var consent=localStorage.getItem('cookie_consent');
  if(consent===null){document.getElementById('cookie-banner').style.display='block';}
  if(consent==='declined'){window['ga-disable-G-715YXLJX2J']=true;}
})();
function acceptCookies(){localStorage.setItem('cookie_consent','accepted');document.getElementById('cookie-banner').style.display='none';}
function declineCookies(){localStorage.setItem('cookie_consent','declined');window['ga-disable-G-715YXLJX2J']=true;document.getElementById('cookie-banner').style.display='none';}
</script>`;
}

function newsletter(subscribeStatus: string | null = null) {
  const feedbackHtml = subscribeStatus === "success"
    ? `<div id="sub-msg" style="margin-bottom:24px;padding:14px 20px;background:${P.gold};color:${P.deep};font-size:14px;font-weight:700;letter-spacing:0.12em;">YOU'RE IN! CHECK YOUR INBOX FOR A WELCOME MESSAGE.</div>`
    : subscribeStatus === "error"
    ? `<div id="sub-msg" style="margin-bottom:24px;padding:14px 20px;background:#8B0000;color:${P.bg};font-size:14px;font-weight:700;letter-spacing:0.12em;">PLEASE ENTER A VALID EMAIL ADDRESS.</div>`
    : "";
  const dismissScript = subscribeStatus
    ? `<script>(function(){history.replaceState(null,'','/');var m=document.getElementById('sub-msg');if(m)setTimeout(function(){m.style.transition='opacity 0.6s';m.style.opacity='0';setTimeout(function(){m.remove()},700)},6000);})()</script>`
    : "";
  return `
<section class="newsletter">
  <svg class="rays" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMid slice">${newsletterRays()}</svg>
  <div class="newsletter-inner">
    <div class="tag">◆  THE  WEEKLY  TRANSMISSION  ◆</div>
    <h2>Join the <em>Resistance.</em></h2>
    <p class="desc">Get one piece of lost botanical knowledge or survival engineering sent to your inbox every week. No spam. No clickbait. Just the truth.</p>
    ${feedbackHtml}
    <form method="POST" action="/subscribe">
      <div class="form-row">
        <input type="email" name="email" placeholder="your.address@homestead.com" required/>
        <button type="submit" class="btn-sub">Subscribe</button>
      </div>
    </form>
    <div class="trust">
      <span>✓  <span id="sub-count-nl">${cfg.subscriberCountText}</span>  READERS</span>
      <span style="opacity:0.4">|</span>
      <span>✓  ONE  EMAIL  PER  WEEK</span>
      <span style="opacity:0.4">|</span>
      <span>✓  UNSUBSCRIBE  ANY  TIME</span>
    </div>
  </div>
</section>${dismissScript}`;
}

export function renderHome(articles: Article[], subscribeStatus: string | null = null): string {
  if (!articles.length) {
    return `${head({ title: `${cfg.name} — ${cfg.tagline}`, description: cfg.description, path: "/", jsonLd: [websiteJsonLd()] })}
${nav()}
<div style="max-width:600px;margin:120px auto;text-align:center;padding:0 32px;">
  <h1 style="font-family:${FONT};font-size:48px;margin-bottom:16px;">No articles yet</h1>
  <p style="font-size:17px;color:${P.muted};">Check back soon.</p>
</div>
${footer()}
</body></html>`;
  }
  const featured = articles.find((a) => a.featured) || articles[0];
  const rest = articles.filter((a) => a !== featured);
  const grid = rest.slice(0, 3);
  const secondary = rest.slice(3, 5);
  const archive = rest.slice(5);

  const highlightsList = (featured.highlights || [])
    .map((h, i) => `<li><span class="num">${String(i + 1).padStart(2, "0")}</span><span>${h}</span></li>`)
    .join("");

  const cardHtml = grid
    .map(
      (a) => `
    <article class="card">
      <div class="card-cat">◆ ${a.category.replace(/\s+/g, "  ")}  ${accessBadge(a)}</div>
      <div class="card-img">
        ${articleImage(a)}
      </div>
      <h3><a href="/articles/${a.slug}">${a.title}</a></h3>
      <p>${a.excerpt}</p>
      <div class="card-meta">
        <span>BY  <strong>${a.author}</strong></span>
        <span>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6.5"/><path d="M 8 4 L 8 8 L 11 10"/></svg>
          ${a.readTime} MIN READ
        </span>
      </div>
    </article>`
    )
    .join("");

  const secondaryHtml = secondary
    .map(
      (a) => `
    <div class="secondary-item">
      <div class="secondary-img">${articleImage(a)}</div>
      <div class="secondary-text">
        <div class="cat">◆  ${a.category}  ${accessBadge(a)}</div>
        <h3><a href="/articles/${a.slug}">${a.title}</a></h3>
        <p>${a.excerpt}</p>
        <div class="byline">BY  <strong>${a.author}</strong> <span style="color:${P.gold}">→</span></div>
      </div>
    </div>`
    )
    .join("");

  return `${head({ title: `${cfg.name} — ${cfg.tagline}`, description: cfg.description, path: "/", jsonLd: [websiteJsonLd()] })}
${nav()}

<section class="hero">
  <div class="hero-inner">
    <div class="hero-breadcrumb">
      <span>FRONT  PAGE</span>
      <span class="line"></span>
      <span>${articles.length}  DISPATCHES  PUBLISHED</span>
    </div>
    <h1>
      Hidden Facts.<br/>
      Forgotten Plants.<br/>
      <span class="accent">Unbreakable</span> Independence.
    </h1>
    <div class="hero-grid">
      <div class="hero-img-wrap">
        ${articleImage(featured, undefined, true)}
        <div class="hero-stamp">Featured  ·  Long  Read</div>
      </div>
      <div class="hero-article">
        <div class="hero-cat">
          <span class="hero-cat-label">◆  ${featured.category}</span>
          <span class="line"></span>
          <span class="hero-cat-read">${accessBadge(featured)}  ·  ${featured.readTime} MIN READ</span>
        </div>
        <h2>${featured.title.replace(/: (.+)$/, ': <em>$1</em>')}</h2>
        <p class="hero-excerpt">
          <span class="hero-dropcap">${featured.excerpt[0]}</span>${featured.excerpt.slice(1)}
        </p>
        <ul class="hero-highlights">${highlightsList}</ul>
        <div class="hero-cta">
          <a href="/articles/${featured.slug}" class="btn-dispatch">
            Read  the  Dispatch
            <svg width="14" height="14" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M 2 8 L 14 8 M 9 3 L 14 8 L 9 13"/></svg>
          </a>
          <div class="hero-byline">
            <strong>${featured.author}</strong>
            <span>${featured.authorRole || ""}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="transmissions">
  <div class="transmissions-inner">
    <div class="section-head">
      <div>
        <div class="section-tag"><span>◆</span><span>SECTION  II</span><span>◆</span></div>
        <h2>Latest Transmissions</h2>
        <p class="sub">Field reports filed this week from contributors in seven countries.</p>
      </div>
      <a href="/archive" class="view-all">VIEW  ALL →</a>
    </div>
    <div class="cards-grid">${cardHtml}</div>
  </div>
</section>

${secondary.length ? `<section class="secondary"><div class="secondary-inner">${secondaryHtml}</div></section>` : ""}

${archive.length ? `<section class="archive">
  <div class="archive-inner">
    <div class="section-head">
      <div>
        <div class="section-tag"><span>◆</span><span>SECTION  IV</span><span>◆</span></div>
        <h2>From the Archive</h2>
        <p class="sub">Every dispatch we've published — the full library.</p>
      </div>
    </div>
    <div class="archive-grid">
      ${archive.map((a) => `<a href="/articles/${a.slug}" class="archive-item" style="text-decoration:none;">
        <div class="archive-thumb">${articleImage(a)}</div>
        <div class="archive-text">
          <div class="cat">◆  ${a.category.toUpperCase()}  ${accessBadge(a)}</div>
          <h4>${a.title}</h4>
          <div class="meta">${a.readTime} MIN  ·  ${a.date}</div>
        </div>
      </a>`).join("")}
    </div>
  </div>
</section>` : ""}

${newsletter(subscribeStatus)}
${footer()}
</body></html>`;
}

const defaultUser: UserContext = { isLoggedIn: false, isPatron: false, displayName: null, userId: null };

function renderComments(slug: string, comments: Comment[], user: UserContext): string {
  const adminIds = cfg.adminUserIds;
  const isAdmin = user.userId ? adminIds.includes(user.userId) : false;

  const commentList = comments.length
    ? comments.map((c) => `
      <div style="padding:16px 0;border-bottom:1px dashed ${P.ink}33;">
        <div style="font-size:12px;color:${P.muted};margin-bottom:6px;">
          <strong style="color:${P.ink};">${sanitizeDisplayName(c.authorName)}</strong>
          · ${new Date(c.timestamp).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          ${isAdmin ? `<form method="POST" action="/articles/${slug}/comments/${c.id}/delete" style="display:inline;margin-left:12px;"><button type="submit" style="background:none;border:none;color:${P.gold};cursor:pointer;font-size:11px;">delete</button></form>` : ""}
        </div>
        <div style="font-size:15px;line-height:1.6;">${sanitizeComment(c.body)}</div>
      </div>`).join("")
    : user.isPatron
      ? `<p style="color:${P.muted};font-style:italic;">Be the first to comment.</p>`
      : `<p style="color:${P.muted};font-size:13px;">No comments yet.</p>`;

  let form = "";
  if (user.isLoggedIn && user.isPatron) {
    form = `<form method="POST" action="/articles/${slug}/comments" style="margin-top:24px;">
      <textarea name="body" rows="3" required placeholder="Share your thoughts..." style="width:100%;padding:12px;font-size:15px;border:1px solid ${P.ink}33;background:${P.bg};font-family:${cfg.typography.body};resize:vertical;"></textarea>
      <button type="submit" style="margin-top:8px;padding:10px 20px;font-size:12px;letter-spacing:0.2em;font-weight:700;text-transform:uppercase;background:${P.ink};color:${P.bg};border:none;cursor:pointer;">Post Comment</button>
    </form>`;
  } else if (user.isLoggedIn) {
    form = `<p style="margin-top:24px;padding:16px;background:${P.paper};border:1px solid ${P.ink}33;font-size:14px;color:${P.muted};">Commenting is a member benefit. <a href="https://buymeacoffee.com/TheAncestralForge" style="color:${P.gold};font-weight:600;">Become a member</a> to join the conversation.</p>`;
  } else {
    form = `<p style="margin-top:24px;padding:16px;background:${P.paper};border:1px solid ${P.ink}33;font-size:14px;color:${P.muted};"><a href="/auth/login" style="color:${P.gold};font-weight:600;">Log in</a> to comment.</p>`;
  }

  return `<section id="comments" style="max-width:780px;margin:0 auto;padding:0 32px 64px;">
    <h2 style="font-family:${FONT};font-size:28px;font-weight:800;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid ${P.ink};">Comments (${comments.length})</h2>
    ${commentList}
    ${form}
  </section>`;
}

function renderPaywall(article: Article): string {
  return `<div style="text-align:center;padding:48px 32px;margin:32px 0;background:${P.paper};border:1px solid ${P.ink}33;">
    <h3 style="font-family:${FONT};font-size:28px;font-weight:800;margin-bottom:12px;">Members Only</h3>
    <p style="font-size:16px;color:${P.muted};margin-bottom:12px;">This article is available exclusively for members.</p>
    <p style="font-size:14px;color:${P.muted};margin-bottom:24px;">Join for $${cfg.minPledgeThreshold}/month to read now, or wait — this article becomes free for everyone in ${cfg.paywallWindowDays} days.</p>
    <a href="https://buymeacoffee.com/TheAncestralForge" target="_blank" style="display:inline-block;padding:14px 32px;background:${P.ink};color:${P.bg};font-size:12px;letter-spacing:0.22em;font-weight:700;text-transform:uppercase;text-decoration:none;box-shadow:2px 2px 0 ${P.gold};">Become a Member</a>
    <p style="font-size:12px;color:${P.muted};margin-top:16px;">Already a member? <a href="/auth/login" style="color:${P.gold};font-weight:600;">Sign in</a></p>
  </div>`;
}

function renderRelated(article: Article, all: Article[]): string {
  const related = relatedArticles(article, all, 4);
  const cat = cfg.categories.find((c) => c.slug === article.category);
  const items = related
    .map((r) => `<li style="padding:14px 0;border-bottom:1px dashed ${P.ink}55;"><a href="/articles/${r.slug}" style="font-family:${FONT};font-weight:700;font-size:19px;line-height:1.2;">${r.title}</a><div style="font-size:14px;line-height:1.5;color:${P.ink}CC;margin-top:4px;">${r.excerpt}</div></li>`)
    .join("");
  const back = cat ? `<p style="margin-top:20px;font-size:12px;letter-spacing:0.18em;font-weight:700;"><a href="/category/${cat.slug}" style="color:${P.gold};">MORE FROM ${cat.name.toUpperCase()} →</a></p>` : "";
  if (!items && !back) return "";
  return `<aside class="related-articles" style="max-width:720px;margin:0 auto;padding:8px 32px 32px;">
  ${items ? `<h2 style="font-family:${FONT};font-weight:800;font-size:26px;margin-bottom:8px;">Related articles</h2><ul style="list-style:none;padding:0;margin:0;">${items}</ul>` : ""}
  ${back}
</aside>`;
}

export function renderArticle(article: Article, user: UserContext = defaultUser, comments: Comment[] = [], allArticles: Article[] = [], crawlerAccess = false): string {
  const gated = isArticleGated(article);
  const hasAccess = canUserAccessArticle(article, user) || crawlerAccess;
  const bodyInner = hasAccess
    ? article.body
    : `<p class="article-p" style="font-size:17px;line-height:1.7;">${article.excerpt}</p>\n${renderPaywall(article)}`;
  const bodyContent = gated ? `<div class="${PAYWALL_SELECTOR.slice(1)}">${bodyInner}</div>` : bodyInner;
  const cat = cfg.categories.find((c) => c.slug === article.category);

  return `${head({
    title: `${article.title} — ${cfg.name}`,
    description: article.excerpt,
    ogTitle: article.title,
    ogDescription: article.excerpt,
    ogImage: article.heroImage,
    path: `/articles/${article.slug}`,
    type: "article",
    publishedTime: article.date,
    jsonLd: [articleJsonLd(article, gated)],
  })}
${nav()}

<article class="article-page">
  <div class="article-meta">◆  ${cat ? `<a href="/category/${cat.slug}">${article.category.toUpperCase()}</a>` : article.category.toUpperCase()}  ·  ${article.readTime} MIN READ${gated && !hasAccess ? '  ·  🔒' : ''}</div>
  <h1>${article.title}</h1>
  <div class="article-byline">
    By <strong>${article.author}</strong>${article.authorRole ? ` · ${article.authorRole}` : ""}
  </div>
  <div class="article-hero-img">
    ${article.heroImage
      ? `<img src="${article.heroImage}" alt="${article.title}" style="display:block;width:100%;height:auto;"/>`
      : getIllustration(article.illustration)}
  </div>
  ${bodyContent}
</article>

${renderRelated(article, allArticles)}
${renderComments(article.slug, comments, user)}
${newsletter()}
${footer()}
</body></html>`;
}

export function renderListing(title: string, articles: Article[], path?: string): string {
  const cards = articles.length
    ? articles.map((a) => `
    <article class="card" style="padding:28px 0;border-bottom:1px dashed ${P.ink}55;">
      <div class="card-cat" style="font-size:10px;letter-spacing:0.32em;font-weight:700;color:${P.gold};margin-bottom:8px;">◆ ${a.category.toUpperCase()}</div>
      <h3 style="font-family:${FONT};font-weight:800;font-size:24px;line-height:1.05;margin-bottom:8px;"><a href="/articles/${a.slug}">${a.title}</a>${isArticleGated(a) ? ' <span style="font-size:14px;color:' + P.gold + ';">🔒</span>' : ''}</h3>
      <p style="font-size:14px;line-height:1.55;color:${P.ink}CC;margin-bottom:8px;">${a.excerpt}</p>
      <div style="font-size:11px;letter-spacing:0.18em;color:${P.muted};">BY <strong style="color:${P.ink}">${a.author}</strong> · ${a.readTime} MIN READ</div>
    </article>`).join("")
    : `<p style="font-size:17px;color:${P.muted};padding:48px 0;">No articles found in this section yet.</p>`;

  return `${head({ title: `${title} — ${cfg.name}`, path })}
${nav()}
<section style="max-width:900px;margin:0 auto;padding:48px 32px;">
  <h1 style="font-family:${FONT};font-weight:800;font-size:clamp(36px,5vw,56px);line-height:1;margin-bottom:32px;border-bottom:2px solid ${P.ink};padding-bottom:16px;">${title}</h1>
  ${cards}
</section>
${footer()}
</body></html>`;
}

export function renderSearch(query: string, articles: Article[]): string {
  const content = !query
    ? `<p style="font-size:17px;color:${P.muted};padding:48px 0;">Enter a search term to find articles.</p>`
    : articles.length
      ? articles.map((a) => `
    <article style="padding:20px 0;border-bottom:1px dashed ${P.ink}55;">
      <h3 style="font-family:${FONT};font-weight:800;font-size:22px;margin-bottom:6px;"><a href="/articles/${a.slug}">${a.title}</a></h3>
      <p style="font-size:14px;color:${P.ink}CC;margin-bottom:4px;">${a.excerpt}</p>
      <span style="font-size:11px;color:${P.muted};">${a.readTime} MIN READ</span>
    </article>`).join("")
      : `<p style="font-size:17px;color:${P.muted};padding:48px 0;">No articles found for "${query}".</p>`;

  return `${head({ title: `Search: ${query || "..."} — ${cfg.name}`, noindex: true })}
${nav()}
<section style="max-width:900px;margin:0 auto;padding:48px 32px;">
  <h1 style="font-family:${FONT};font-weight:800;font-size:36px;margin-bottom:24px;">Search</h1>
  <form action="/search" method="GET" style="margin-bottom:32px;">
    <input type="text" name="q" value="${query}" placeholder="Search articles..." style="width:100%;padding:12px 16px;font-size:16px;border:1px solid ${P.ink};background:${P.bg};font-family:${FONT};"/>
  </form>
  ${content}
</section>
${footer()}
</body></html>`;
}

export function renderLogin(error?: string, success?: boolean): string {
  const content = success
    ? `<div style="text-align:center;padding:48px 0;">
        <h2 style="font-family:${FONT};font-size:32px;margin-bottom:16px;">Check your email</h2>
        <p style="font-size:17px;color:${P.muted};">We sent you a sign-in link. Click it to log in.</p>
        <p style="font-size:13px;color:${P.muted};margin-top:12px;">Link expires in 15 minutes.</p>
      </div>`
    : `<form method="POST" action="/auth/login" style="max-width:400px;margin:0 auto;">
        <h2 style="font-family:${FONT};font-size:32px;margin-bottom:8px;">Sign in</h2>
        <p style="font-size:15px;color:${P.muted};margin-bottom:24px;">Enter your email and we'll send you a magic link.</p>
        ${error ? `<div style="padding:12px;margin-bottom:16px;background:${P.paper};border:1px solid ${P.gold};color:${P.ink};font-size:14px;">${error}</div>` : ""}
        <input type="email" name="email" required placeholder="your@email.com" style="width:100%;padding:14px 16px;font-size:16px;border:1px solid ${P.ink};background:${P.bg};margin-bottom:16px;font-family:${FONT};"/>
        <button type="submit" style="width:100%;padding:14px;font-size:13px;letter-spacing:0.2em;font-weight:700;text-transform:uppercase;background:${P.ink};color:${P.bg};border:none;cursor:pointer;">Send Login Link</button>
        <p style="font-size:12px;color:${P.muted};margin-top:16px;text-align:center;">Active <a href="https://buymeacoffee.com/TheAncestralForge" style="color:${P.gold};">Buy Me a Coffee</a> members get full access to all articles + commenting.</p>
      </form>`;

  return `${head({ title: `Sign In — ${cfg.name}`, noindex: true })}
${nav()}
<section style="max-width:500px;margin:0 auto;padding:80px 32px;">
  ${content}
</section>
${footer()}
</body></html>`;
}

export function renderUnsubscribe(success: boolean): string {
  const msg = success
    ? `<h2 style="font-family:${FONT};font-size:32px;margin-bottom:16px;">You've been unsubscribed.</h2>
       <p style="font-size:17px;color:${P.muted};margin-bottom:32px;">You will no longer receive emails from us.</p>`
    : `<h2 style="font-family:${FONT};font-size:32px;margin-bottom:16px;">We couldn't process your request.</h2>
       <p style="font-size:17px;color:${P.muted};margin-bottom:32px;">The link may be invalid or expired.</p>`;
  return `${head({ title: `Unsubscribe — ${cfg.name}`, noindex: true })}
${nav()}
<div style="max-width:600px;margin:120px auto;text-align:center;padding:0 32px;">
  ${msg}
  <a href="/" class="btn-dispatch">Return to the Front Page</a>
</div>
${footer()}
</body></html>`;
}

export function render404(): string {
  return `${head({ title: `Not Found — ${cfg.name}`, noindex: true })}
${nav()}
<div style="max-width:600px;margin:120px auto;text-align:center;padding:0 32px;">
  <h1 style="font-family:${FONT};font-size:64px;margin-bottom:16px;">404</h1>
  <p style="font-size:17px;color:${P.muted};margin-bottom:32px;">This dispatch has been lost to time.</p>
  <a href="/" class="btn-dispatch">Return to the Front Page</a>
</div>
${footer()}
</body>
</html>`;
}
