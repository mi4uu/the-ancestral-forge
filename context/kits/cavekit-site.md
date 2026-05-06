---
created: "2026-05-06"
last_edited: "2026-05-06"
---

# Cavekit: Site

## Scope

All site-level configuration that makes the platform white-label ready. A single configuration source defines site identity, navigation, categories, color palettes, font stacks, footer content, social links, and legal text. No brand-specific strings exist anywhere in templates or source code — all branding flows from configuration.

This kit covers the configuration schema and the contract that templates and rendering layers must honor. It does not cover multi-tenancy, runtime config switching, or any admin UI for editing configuration.

## Requirements

### R1: Site Configuration Source

**Description:** A single configuration source defines all site identity, structural content, and operational parameters. This includes: site name, tagline, description, navigation items (label + destination), categories, footer columns (with grouped links), legal disclaimer text, subscriber count display text, social media links (platform + URL pairs), paywall window duration, minimum pledge threshold, session expiration duration, Patreon OAuth credentials/callback URL, and admin user identifier(s) for moderation.

**Acceptance Criteria:**

- [ ] A configuration source exists that contains all site identity fields: name, tagline, description, navigation items, categories, footer columns, legal disclaimer text, subscriber count display, and social links.
- [ ] The configuration source includes operational parameters: paywall window duration (default 30 days), minimum pledge threshold (default $3), session expiration duration (default 30 days), Patreon OAuth client credentials, OAuth callback URL, and admin user identifier(s).
- [ ] Changing the site name in configuration causes it to appear updated in: the navigation bar, the footer, all page title tags, and all meta tags — with no other changes required.
- [ ] Adding a new navigation item to configuration causes it to render in the navigation bar without any code changes.
- [ ] Removing a navigation item from configuration causes it to disappear from the navigation bar without any code changes.
- [ ] Changing the legal disclaimer text in configuration causes it to update wherever legal text is displayed.
- [ ] Adding a social link entry to configuration causes it to appear in the social links display area.
- [ ] Changing the paywall window duration in configuration changes how long articles remain gated.
- [ ] Changing the minimum pledge threshold in configuration changes the required pledge level for patron access.

**Dependencies:** None.

---

### R2: Category Registry

**Description:** Categories are defined exclusively in site configuration, not hardcoded in templates or source code. Articles reference categories by slug. The system handles unknown or missing category slugs gracefully without errors.

**Acceptance Criteria:**

- [ ] All available categories are defined in the site configuration source, each with at least a name and a slug.
- [ ] Adding a new category to configuration makes it available for article assignment and browsable on the site without code changes.
- [ ] Removing a category from configuration removes it from navigation and listing pages.
- [ ] An article referencing a category slug that does not exist in configuration still renders without error, falling back to a generic presentation (no category-specific styling or label).
- [ ] Category definitions support at minimum: slug, display name, and description.

**Dependencies:** None.

---

### R3: Palette and Typography Configuration

**Description:** Color palettes and font stacks are defined in configuration. Templates and stylesheets consume named tokens (e.g., "primary", "heading-font"), never raw color values or font names directly.

**Acceptance Criteria:**

- [ ] Color palette values are defined in the site configuration source as named tokens.
- [ ] Font stacks are defined in the site configuration source as named tokens.
- [ ] Changing a palette token value in configuration changes the corresponding color everywhere on the site.
- [ ] Changing a font stack token in configuration changes the corresponding font everywhere on the site.
- [ ] No hex color literals, RGB values, or hardcoded font family names appear in template source code outside of the configuration-to-stylesheet generation layer.

**Dependencies:** None.

---

### R4: White-Label Isolation

**Description:** Zero brand-specific strings exist in source code, templates, or stylesheets. All branding — site name, tagline, descriptions, labels, legal text, social links, colors, fonts — flows exclusively from the configuration source defined in R1/R2/R3.

**Acceptance Criteria:**

- [ ] A text search of all template files, stylesheet source, and application source code reveals zero instances of the site name as a hardcoded string (outside of configuration files and test fixtures).
- [ ] Duplicating the entire project and replacing only the configuration source with different branding values produces a fully rebranded site — different name, tagline, colors, fonts, categories — with no code modifications.
- [ ] All user-visible text that refers to the site identity (name, tagline, description) is read from configuration at render time.

**Dependencies:** R1, R3.

## Out of Scope

- Multi-tenancy — one running instance serves exactly one site.
- Runtime configuration switching — configuration is read at startup or build time.
- Admin UI for editing configuration — configuration is edited as a file.
- Content management — article loading and rendering belong to the Content domain.

## Cross-References

- Content depends on Site for category definitions (R2) and site metadata for SEO/RSS.
- Vault depends on Site for paywall duration configuration.
- Community depends on Site for admin identifier configuration.
