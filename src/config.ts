/**
 * Typed configuration module.
 * Imports site.config.ts, exports typed interfaces and helpers.
 */

import siteConfig from "../site.config";

// ── Interfaces ───────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
}

export interface Category {
  slug: string;
  name: string;
  description: string;
}

export interface FooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}

export interface SocialLink {
  platform: string;
  url: string;
  label: string;
}

export interface PaletteTokens {
  bg: string;
  paper: string;
  ink: string;
  muted: string;
  gold: string;
  accent: string;
  deep: string;
}

export interface TypographyTokens {
  heading: string;
  body: string;
}

export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  url: string;
  nav: NavItem[];
  categories: Category[];
  footer: {
    columns: FooterColumn[];
    legalDisclaimer: string;
  };
  subscriberCountText: string;
  socialLinks: SocialLink[];
  palette: PaletteTokens;
  typography: TypographyTokens;
  paywallWindowDays: number;
  minPledgeThreshold: number;
  sessionExpirationDays: number;
  patreon: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
  adminUserIds: string[];
}

// ── Frozen singleton ─────────────────────────────────────────────

const config: SiteConfig = Object.freeze(siteConfig) as SiteConfig;

export function getConfig(): SiteConfig {
  return config;
}

export function getCategory(slug: string): Category | undefined {
  return config.categories.find((c) => c.slug === slug);
}

export function getAllCategories(): readonly Category[] {
  return config.categories;
}
