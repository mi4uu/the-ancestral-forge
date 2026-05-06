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
| T-016 | DONE | loadArticles with try/catch, skips missing index.md |
| T-017 | DONE | Hot reload: articles reloaded from disk each request. Malformed frontmatter logged+skipped. |
| T-018 | DONE | GET /category/:slug — filters articles, empty state |
| T-019 | DONE | GET /tag/:slug — filters by tags array, empty state |
| T-020 | DONE | GET /search?q= — relevance-ranked, case-insensitive |
| T-028 | DONE | SEO meta — title, description, og:title, og:description on article pages |
| T-029 | DONE | SEO meta on listing/category/tag pages with title from page name |
| T-035 | DONE | RSS 2.0 at /rss — vault-aware: gated=excerpt only, public=full content |
