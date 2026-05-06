---
created: "2026-05-06"
last_edited: "2026-05-06"
---

# Cavekit Overview

## Project

The Ancestral Forge — editorial dispatch on self-sufficiency, lost ancestral knowledge, off-grid engineering, and forgotten medicinal plants. White-label magazine platform with Patreon-based patronage, time-gated paywall, and patron-only community features.

## Domain Index

| Domain | File | Summary | Reqs | ACs |
|--------|------|---------|------|-----|
| Site | cavekit-site.md | White-label configuration: identity, navigation, categories, palette, typography, footer, social links, operational params | 4 | 22 |
| Content | cavekit-content.md | Article loading, markdown rendering, search, category/tag pages, RSS, SEO metadata | 7 | 40 |
| Auth | cavekit-auth.md | Patreon OAuth login/logout, sessions, pledge verification, user context | 4 | 22 |
| Vault | cavekit-vault.md | Time-based paywall, patron bypass, paywall UI, per-article override | 4 | 16 |
| Community | cavekit-community.md | Patron-only comments: submission, display, storage, moderation, safety | 5 | 24 |

**Totals:** 5 domains, 24 requirements, 124 acceptance criteria.

## Cross-Reference Map

| Domain A | Interacts With | Interaction Type |
|----------|---------------|-----------------|
| Content | Site | Depends on: category definitions (Site R2), site metadata for SEO/RSS (Site R1) |
| Auth | Site | Depends on: pledge threshold, session duration, callback config (Site R1) |
| Vault | Auth | Depends on: patron status from user context (Auth R4) |
| Vault | Content | Depends on: article date and free flag from frontmatter (Content R2) |
| Vault | Site | Depends on: paywall window duration (Site R1) |
| Content | Vault | Depends on: paywall rules for RSS content gating (Vault R1, R4) |
| Community | Auth | Depends on: patron status, user identity (Auth R4) |
| Community | Content | Depends on: articles as comment context, article slug (Content R1, R2) |
| Community | Site | Depends on: admin identifier for moderation (Site R1) |

## Dependency Graph

```
Site (foundation — no dependencies)
 |
 +---> Content (depends on Site)
 |       |
 |       +---> [bidirectional with Vault for RSS gating]
 |
 +---> Auth (depends on Site)
 |       |
 |       +---> Vault (depends on Auth, Content, Site)
 |       |
 |       +---> Community (depends on Auth, Content, Site)
 |
 +---> Vault (depends on Site)
 |
 +---> Community (depends on Site)
```

**Build order (leaf to root):** Site -> Content + Auth (parallel) -> Vault -> Community

Note: Content and Vault have a bidirectional reference (Content R5 RSS respects Vault paywall rules). This is an interface dependency, not a circular build dependency — Content defines the RSS output contract, Vault defines the gating rules, and the RSS renderer consumes both.

## Domain Boundaries

- **Site** owns all configuration and branding. Other domains read from it but never write to it.
- **Content** owns article loading, rendering, and discovery. It is the single source for article data.
- **Auth** owns identity and session. It is the single source for "who is this user?" and "are they a patron?"
- **Vault** owns access decisions. It answers "can this user see this content?" by combining Auth and Content signals.
- **Community** owns comments. It depends on Auth for permissions and Content for article context.
