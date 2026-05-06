---
created: "2026-05-06"
last_edited: "2026-05-06"
---
# Implementation Tracking: Auth

Build site: context/plans/build-site.md

| Task | Status | Notes |
|------|--------|-------|
| T-013 | DONE | src/auth/sessions.ts — crypto.randomUUID, Map + file persistence |
| T-014 | DONE | GET /logout — destroys session, clears cookie, 303 redirect |
| T-021 | DONE | GET /auth/login — redirects to Patreon OAuth with correct params |
| T-022 | | Patreon OAuth callback (token exchange + session creation implemented) |
| T-023 | | OAuth error handling |
| T-024 | | Pledge verification |
| T-025 | | Pledge status refresh |
| T-026 | | User context middleware |
| T-027 | | Login prompt template |
