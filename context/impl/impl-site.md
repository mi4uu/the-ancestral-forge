---
created: "2026-05-06"
last_edited: "2026-05-06"
---
# Implementation Tracking: Site

Build site: context/plans/build-site.md

| Task | Status | Notes |
|------|--------|-------|
| T-001 | DONE | site.config.ts + src/config.ts — all identity + operational params |
| T-002 | DONE | Categories in config with slug/name/description, getCategory/getAllCategories helpers |
| T-003 | | Unknown category fallback |
| T-004 | DONE | Palette/typography tokens in config, templates consume via cfg.palette/cfg.typography |
| T-005 | | Eliminate hardcoded colors from templates |
| T-006 | DONE | Nav renders from cfg.nav, site name from cfg.name |
| T-007 | DONE | Footer columns, legal text, social links from config |
| T-008 | DONE | paywallWindowDays, minPledgeThreshold exported via getConfig() |
| T-009 | | White-label audit |
