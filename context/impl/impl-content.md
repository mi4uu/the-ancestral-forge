---
created: "2026-05-06"
last_edited: "2026-05-06"
---
# Implementation Tracking: Content

Build site: context/plans/build-site.md

| Task | Status | Notes |
|------|--------|-------|
| T-010 | DONE | Article interface — all fields, defaults, tags[] |
| T-011 | DONE | markdownToHtml — h1-h6, links, images, code blocks, blockquotes |
| T-012 | DONE | sanitizeHtml strips script tags and event handlers |
| T-016 | DONE | loadArticles with try/catch, skips missing index.md with console.warn |
| T-017 | | Hot reload / error resilience |
| T-018 | DONE | GET /category/:slug — filters articles, empty state for no matches |
| T-019 | DONE | GET /tag/:slug — filters by tags array, empty state |
| T-020 | DONE | GET /search?q= — title/excerpt/body search, relevance ranked, case-insensitive |
| T-028 | DONE | SEO meta tags — title, description, og:title, og:description on all pages |
| T-029 | | SEO for listing pages |
| T-035 | | RSS feed (placeholder exists) |
