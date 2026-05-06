import type { Article } from "./content";
import { getIllustration } from "./illustrations";

const P = {
  bg: "#F5EFE0", paper: "#EFE7D5", ink: "#1A2F24",
  muted: "#5C6B5F", gold: "#B8860B", accent: "#2F5A3D", deep: "#0F1F17",
};
const FONT = `'Playfair Display', 'Source Serif Pro', Georgia, serif`;

function head(title: string) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
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
  .nav-main { display: flex; align-items: center; justify-content: space-between; padding: 0 32px; height: 64px; }
  .nav-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
  .nav-logo span { font-family: ${FONT}; font-weight: 700; letter-spacing: 0.22em; font-size: 15px; color: ${P.ink}; }
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
  .card-cat { font-size: 10px; letter-spacing: 0.32em; font-weight: 700; color: ${P.gold}; margin-bottom: 16px; }
  .card-img { position: relative; margin-bottom: 20px; border: 1px solid ${P.ink}; }
  .card-img svg { display: block; width: 100%; height: 220px; }
  .card-tag { position: absolute; top: 8px; right: 8px; padding: 2px 8px; font-size: 9px; letter-spacing: 0.22em; background: ${P.bg}; border: 1px solid ${P.ink}; color: ${P.ink}; }
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
  .secondary-text { padding: 28px; display: flex; flex-direction: column; }
  .secondary-text .cat { font-size: 10px; letter-spacing: 0.3em; font-weight: 700; color: ${P.gold}; margin-bottom: 12px; }
  .secondary-text h3 { font-family: ${FONT}; font-weight: 800; font-size: 24px; line-height: 1.05; margin-bottom: 12px; text-wrap: balance; }
  .secondary-text h3 a { text-decoration: none; }
  .secondary-text h3 a:hover { text-decoration: underline; }
  .secondary-text p { font-size: 13px; line-height: 1.55; color: ${P.ink}CC; margin-bottom: 16px; }
  .secondary-text .byline { margin-top: auto; font-size: 11px; letter-spacing: 0.2em; color: ${P.muted}; }
  .secondary-text .byline strong { color: ${P.ink}; font-weight: 600; }

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
  .article-hero-img { margin-bottom: 40px; border: 1px solid ${P.ink}; }
  .article-hero-img svg { display: block; width: 100%; height: 400px; }
  .article-h2 { font-family: ${FONT}; font-weight: 800; font-size: 32px; line-height: 1.1; margin: 48px 0 16px; color: ${P.ink}; }
  .article-h3 { font-family: ${FONT}; font-weight: 700; font-size: 24px; line-height: 1.15; margin: 36px 0 12px; color: ${P.ink}; }
  .article-p { font-size: 17px; line-height: 1.7; margin-bottom: 20px; color: ${P.ink}; }
  .article-ol, .article-ul { margin: 16px 0 24px 24px; font-size: 16px; line-height: 1.7; }
  .article-li, .article-li-ul { margin-bottom: 8px; }

  /* Responsive */
  @media (max-width: 1024px) {
    .hero-grid { grid-template-columns: 1fr; }
    .cards-grid { grid-template-columns: 1fr; }
    .card + .card { border-left: none; border-top: 1px solid ${P.ink}; padding-top: 28px; }
    .secondary-inner { grid-template-columns: 1fr; }
    .secondary-item + .secondary-item { border-left: none; border-top: 1px solid ${P.ink}; }
    .nav-links { display: none; }
    .nav-eyebrow .hide-mobile { display: none; }
    .footer-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 640px) {
    .hero, .transmissions, .secondary, .footer { padding-left: 16px; padding-right: 16px; }
    .nav-eyebrow, .nav-main { padding-left: 16px; padding-right: 16px; }
    .newsletter { padding-left: 16px; padding-right: 16px; }
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

function nav() {
  return `
<header class="nav-header">
  <div class="nav-eyebrow">
    <span>EST. ANNO MMXXIV  ·  VOL. III  ·  №  47</span>
    <span class="hide-mobile">MONDAY  ·  4 MAY 2026  ·  WAXING GIBBOUS  ·  FROST WARN: NONE</span>
    <span>SUBSCRIBERS: 84,512</span>
  </div>
  <nav class="nav-main">
    <a href="/" class="nav-logo">
      <svg width="28" height="28" viewBox="0 0 40 40" fill="none" stroke="${P.ink}" stroke-width="1.6" stroke-linecap="round">
        <path d="M 6 16 L 34 16 L 30 22 L 22 22 L 22 30 L 18 30 L 18 22 L 10 22 Z" fill="${P.ink}"/>
        <path d="M 14 30 L 26 30 L 28 34 L 12 34 Z"/>
        <path d="M 20 8 L 20 14 M 16 11 L 24 11"/>
      </svg>
      <span>THE ANCESTRAL FORGE</span>
    </a>
    <div class="nav-links">
      <a href="#">The Apothecary</a>
      <a href="#">The Living Pantry</a>
      <a href="#">The Forge</a>
      <a href="#">Field Notes</a>
      <a href="#">Archive</a>
    </div>
    <div class="nav-actions">
      <button class="btn-search" aria-label="Search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
          <circle cx="11" cy="11" r="7"/><path d="M 20 20 L 16 16"/>
        </svg>
      </button>
      <a href="#" class="btn-vault">Unlock the Vault</a>
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
        <div class="footer-brand">THE  ANCESTRAL  FORGE</div>
        <p class="footer-desc">An editorial dispatch on self-sufficiency, lost ancestral knowledge, off-grid engineering, and the medicinal plants the modern world has forgotten how to use.</p>
      </div>
      <div class="footer-col">
        <div class="footer-col-head">◆ SECTIONS</div>
        <ul><li><a href="#">The Apothecary</a></li><li><a href="#">The Living Pantry</a></li><li><a href="#">The Forge</a></li><li><a href="#">Field Notes</a></li><li><a href="#">Archive</a></li></ul>
      </div>
      <div class="footer-col">
        <div class="footer-col-head">◆ THE VAULT</div>
        <ul><li><a href="#">Subscribe</a></li><li><a href="#">Members' Library</a></li><li><a href="#">Annual Almanac</a></li><li><a href="#">Seed Exchange</a></li></ul>
      </div>
      <div class="footer-col">
        <div class="footer-col-head">◆ CORRESPOND</div>
        <ul><li><a href="#">Submit a Dispatch</a></li><li><a href="#">Letters Column</a></li><li><a href="#">Mailing Address</a></li><li><a href="#">Press</a></li></ul>
      </div>
      <div></div>
    </div>
    <div class="footer-bottom">
      <span>©  2026  THE  ANCESTRAL  FORGE.  RECLAIMING  THE  LOST  ARTS.</span>
      <div class="footer-bottom-links">
        <a href="#">PRIVACY</a><a href="#">TERMS</a><a href="#">COLOPHON</a><a href="#">RSS</a>
      </div>
    </div>
    <div class="footer-disclaimer">
      <strong>Medical Disclaimer  ·  </strong>
      The botanical, nutritional, and engineering information published in this journal is offered for educational and historical purposes only. Nothing presented here is intended to diagnose, treat, cure, or prevent any disease, nor to replace the counsel of a qualified medical practitioner. Consult your physician before altering diet, supplementation, or medication. The Ancestral Forge accepts no responsibility for outcomes arising from the application of this material.
    </div>
  </div>
</footer>`;
}

function newsletter() {
  return `
<section class="newsletter">
  <svg class="rays" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMid slice">${newsletterRays()}</svg>
  <div class="newsletter-inner">
    <div class="tag">◆  THE  WEEKLY  TRANSMISSION  ◆</div>
    <h2>Join the <em>Resistance.</em></h2>
    <p class="desc">Get one piece of lost botanical knowledge or survival engineering sent to your inbox every week. No spam. No clickbait. Just the truth.</p>
    <form method="POST" action="/subscribe">
      <div class="form-row">
        <input type="email" name="email" placeholder="your.address@homestead.com" required/>
        <button type="submit" class="btn-sub">Subscribe</button>
      </div>
    </form>
    <div class="trust">
      <span>✓  84,512  READERS</span>
      <span style="opacity:0.4">|</span>
      <span>✓  ONE  EMAIL  PER  WEEK</span>
      <span style="opacity:0.4">|</span>
      <span>✓  UNSUBSCRIBE  ANY  TIME</span>
    </div>
  </div>
</section>`;
}

export function renderHome(articles: Article[]): string {
  const featured = articles.find((a) => a.featured) || articles[0];
  const grid = articles.filter((a) => !a.featured).slice(0, 3);
  const secondary = articles.filter((a) => !a.featured).slice(3, 5);

  const highlightsList = (featured.highlights || [])
    .map((h, i) => `<li><span class="num">${String(i + 1).padStart(2, "0")}</span><span>${h}</span></li>`)
    .join("");

  const cardHtml = grid
    .map(
      (a, i) => `
    <article class="card">
      <div class="card-cat">◆ ${a.category.replace(/\s+/g, "  ")}</div>
      <div class="card-img">
        ${getIllustration(a.illustration)}
        <div class="card-tag">${a.tag}</div>
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
      (a, i) => `
    <div class="secondary-item">
      <div class="secondary-img">${getIllustration(a.illustration)}</div>
      <div class="secondary-text">
        <div class="cat">◆  ${a.category}</div>
        <h3><a href="/articles/${a.slug}">${a.title}</a></h3>
        <p>${a.excerpt}</p>
        <div class="byline">BY  <strong>${a.author}</strong> <span style="color:${P.gold}">→</span></div>
      </div>
    </div>`
    )
    .join("");

  return `${head("The Ancestral Forge — Hidden Facts. Forgotten Plants. Unbreakable Independence.")}
${nav()}

<section class="hero">
  <div class="hero-inner">
    <div class="hero-breadcrumb">
      <span>FRONT  PAGE</span>
      <span class="line"></span>
      <span>ISSUE  №  47</span>
      <span class="line"></span>
      <span>WEEK  OF  IV  MAY  ANNO  MMXXVI</span>
    </div>
    <h1>
      Hidden Facts.<br/>
      Forgotten Plants.<br/>
      <span class="accent">Unbreakable</span> Independence.
    </h1>
    <div class="hero-grid">
      <div class="hero-img-wrap">
        ${getIllustration(featured.illustration)}
        <div class="hero-stamp">Featured  ·  Long  Read</div>
        <div class="hero-plate">
          <span>PLATE IV  ·  HAND-DRAWN  ·  E. WHITTIER</span>
          <span>ANGELICA  KEISKEI  KOIDZUMI</span>
        </div>
      </div>
      <div class="hero-article">
        <div class="hero-cat">
          <span class="hero-cat-label">◆  ${featured.category}</span>
          <span class="line"></span>
          <span class="hero-cat-read">${featured.readTime} MIN READ</span>
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
      <a href="#" class="view-all">VIEW  ALL →</a>
    </div>
    <div class="cards-grid">${cardHtml}</div>
  </div>
</section>

${secondary.length ? `<section class="secondary"><div class="secondary-inner">${secondaryHtml}</div></section>` : ""}

${newsletter()}
${footer()}
</body></html>`;
}

export function renderArticle(article: Article): string {
  return `${head(`${article.title} — The Ancestral Forge`)}
${nav()}

<article class="article-page">
  <div class="article-meta">◆  ${article.category}  ·  ${article.readTime} MIN READ</div>
  <h1>${article.title}</h1>
  <div class="article-byline">
    By <strong>${article.author}</strong>${article.authorRole ? ` · ${article.authorRole}` : ""}
  </div>
  <div class="article-hero-img">
    ${getIllustration(article.illustration)}
  </div>
  ${article.body}
</article>

${newsletter()}
${footer()}
</body></html>`;
}

export function render404(): string {
  return `${head("Not Found — The Ancestral Forge")}
${nav()}
<div style="max-width:600px;margin:120px auto;text-align:center;padding:0 32px;">
  <h1 style="font-family:${FONT};font-size:64px;margin-bottom:16px;">404</h1>
  <p style="font-size:17px;color:${P.muted};margin-bottom:32px;">This dispatch has been lost to time.</p>
  <a href="/" class="btn-dispatch">Return to the Front Page</a>
</div>
${footer()}
</body></html>`;
}
