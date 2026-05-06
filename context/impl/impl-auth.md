---
created: "2026-05-06"
last_edited: "2026-05-06"
---
# Implementation Tracking: Auth

Build site: context/plans/build-site.md

| Task | Status | Notes |
|------|--------|-------|
| T-013 | DONE | src/auth/sessions.ts — crypto.randomUUID, Map + file persistence |
| T-014 | DONE | GET /logout — destroys session, clears cookie, 303 |
| T-021 | DONE | GET /auth/login — redirects to Patreon OAuth |
| T-022 | DONE | GET /auth/callback — exchanges code, creates session, sets cookie |
| T-023 | DONE | OAuth error handling — denied access + token exchange failure |
| T-024 | DONE | fetchPatreonUser checks pledge >= minPledgeThreshold |
| T-025 | DONE | Periodic pledge refresh via lastPledgeCheck in middleware |
| T-026 | DONE | getUserContext middleware — isLoggedIn, isPatron, displayName, userId |
| T-027 | DONE | Login prompt template for unauthenticated/non-patron users |
