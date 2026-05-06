---
created: "2026-05-06"
last_edited: "2026-05-06"
---
# Implementation Tracking: Site

Build site: context/plans/build-site.md

| Task | Status | Notes |
|------|--------|-------|
| T-001 | DONE | site.config.ts + src/config.ts — all identity + operational params |
| T-002 | DONE | Categories in config with slug/name/description |
| T-003 | DONE | Unknown category renders without error, shows slug as fallback |
| T-004 | DONE | Palette/typography tokens consumed from config |
| T-005 | DONE | Zero hardcoded hex in templates.ts (illustrations exempt — artwork) |
| T-006 | DONE | Nav renders from cfg.nav, site name from cfg.name |
| T-007 | DONE | Footer columns, legal text, social links from config |
| T-008 | DONE | paywallWindowDays, minPledgeThreshold exported via getConfig() |
| T-009 | DONE | White-label audit: grep src/ for brand strings = zero matches |
