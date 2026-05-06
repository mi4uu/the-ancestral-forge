/**
 * Site configuration — single source of truth.
 * All identity, branding, categories, design tokens, and operational params.
 * Swap this file to white-label the entire site.
 */

const siteConfig = {
  // ── Identity ───────────────────────────────────────────────────
  name: "The Ancestral Forge",
  tagline: "Hidden Facts. Forgotten Plants. Unbreakable Independence.",
  description:
    "An editorial dispatch on self-sufficiency, lost ancestral knowledge, off-grid engineering, and the medicinal plants the modern world has forgotten how to use.",
  url: "https://ancestralforge.org",

  // ── Navigation ─────────────────────────────────────────────────
  nav: [
    { label: "The Apothecary", href: "/category/the-apothecary" },
    { label: "The Living Pantry", href: "/category/the-living-pantry" },
    { label: "The Forge", href: "/category/the-forge" },
    { label: "Field Notes", href: "/category/field-notes" },
    { label: "Archive", href: "/category/archive" },
  ],

  // ── Categories ─────────────────────────────────────────────────
  categories: [
    { slug: "the-apothecary", name: "The Apothecary", description: "Herbal preparations, forgotten remedies, and the medicinal craft of plants." },
    { slug: "the-living-pantry", name: "The Living Pantry", description: "Fermentation, preservation, and perennial gardening." },
    { slug: "the-forge", name: "The Forge", description: "Survival engineering, off-grid design, and hands-on ancestral skills." },
    { slug: "field-notes", name: "Field Notes", description: "Short dispatches, seasonal logs, and observations from the land." },
    { slug: "archive", name: "Archive", description: "The full collection, indexed by date and topic." },
  ],

  // ── Footer ─────────────────────────────────────────────────────
  footer: {
    columns: [
      {
        heading: "SECTIONS",
        links: [
          { label: "The Apothecary", href: "/category/the-apothecary" },
          { label: "The Living Pantry", href: "/category/the-living-pantry" },
          { label: "The Forge", href: "/category/the-forge" },
          { label: "Field Notes", href: "/category/field-notes" },
          { label: "Archive", href: "/category/archive" },
        ],
      },
      {
        heading: "THE VAULT",
        links: [
          { label: "Subscribe", href: "#" },
          { label: "Members' Library", href: "#" },
          { label: "Annual Almanac", href: "#" },
          { label: "Seed Exchange", href: "#" },
        ],
      },
      {
        heading: "CORRESPOND",
        links: [
          { label: "Submit a Dispatch", href: "#" },
          { label: "Letters Column", href: "#" },
          { label: "Mailing Address", href: "#" },
          { label: "Press", href: "#" },
        ],
      },
    ],
    legalDisclaimer:
      "The botanical, nutritional, and engineering information published in this journal is offered for educational and historical purposes only. Nothing presented here is intended to diagnose, treat, cure, or prevent any disease, nor to replace the counsel of a qualified medical practitioner. Consult your physician before altering diet, supplementation, or medication. The Ancestral Forge accepts no responsibility for outcomes arising from the application of this material.",
  },

  subscriberCountText: "84,512",

  // ── Social Links ───────────────────────────────────────────────
  socialLinks: [
    { platform: "rss", url: "/rss", label: "RSS" },
  ],

  // ── Design Tokens: Palette ─────────────────────────────────────
  palette: {
    bg: "#F5EFE0",
    paper: "#EFE7D5",
    ink: "#1A2F24",
    muted: "#5C6B5F",
    gold: "#B8860B",
    accent: "#2F5A3D",
    deep: "#0F1F17",
  },

  // ── Design Tokens: Typography ──────────────────────────────────
  typography: {
    heading: "'Playfair Display', 'Source Serif Pro', Georgia, serif",
    body: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  },

  // ── Operational Parameters ─────────────────────────────────────
  paywallWindowDays: 30,
  minPledgeThreshold: 3,
  sessionExpirationDays: 30,

  patreon: {
    clientId: process.env.PATREON_CLIENT_ID || "",
    clientSecret: process.env.PATREON_CLIENT_SECRET || "",
    callbackUrl: process.env.PATREON_CALLBACK_URL || "https://ancestralforge.org/auth/callback",
  },

  adminUserIds: [] as string[],
};

export default siteConfig;
