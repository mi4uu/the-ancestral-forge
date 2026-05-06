---
created: "2026-05-06"
last_edited: "2026-05-06"
---
# Implementation Tracking: Community

Build site: context/plans/build-site.md

| Task | Status | Notes |
|------|--------|-------|
| T-015 | DONE | src/community/safety.ts — escapeHtml, linkify, sanitizeComment, sanitizeDisplayName |
| T-036 | DONE | src/community/storage.ts — JSON per slug, getComments/addComment/deleteComment |
| T-037 | DONE | POST /articles/:slug/comments — patron-only, validates body, sanitizes |
| T-038 | DONE | Comment form: patron=form, non-patron=benefit msg, anon=login prompt |
| T-039 | DONE | Comments: publicly visible, oldest first, author+timestamp+body, empty states |
| T-040 | DONE | POST /articles/:slug/comments/:id/delete — admin-only via config adminUserIds |
