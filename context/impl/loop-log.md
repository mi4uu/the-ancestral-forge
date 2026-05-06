### Iteration 1 — 2026-05-06
- T-001: Site Configuration Schema — DONE. Files: site.config.ts, src/config.ts. Build P, Tests P. 
- T-010: Article Metadata Schema — DONE. Files: src/content.ts. Build P, Tests P.
- T-011: Markdown Renderer Full Support — DONE. Files: src/content.ts. Build P, Tests P.
- T-013: Session Management — DONE. Files: src/auth/sessions.ts. Build P, Tests P.
- T-015: Content Safety Module — DONE. Files: src/community/safety.ts. Build P, Tests P.
- Next: T-002, T-004, T-005, T-006, T-007, T-008, T-012, T-014

### Iteration 2 — 2026-05-06
- T-002: Category Registry — DONE. Config already has categories[]. Verified.
- T-004: Palette/Typography Tokens — DONE. Templates use cfg.palette/cfg.typography.heading.
- T-006: Config-Driven Nav — DONE. Nav renders from cfg.nav, name from cfg.name.
- T-007: Config-Driven Footer — DONE. Footer columns, legal, social from config.
- T-008: Operational Params — DONE. paywallWindowDays/minPledgeThreshold exported.
- T-012: Markdown XSS — DONE. sanitizeHtml strips scripts/event handlers.
- T-014: Logout — DONE. GET /logout destroys session, clears cookie, 303.
- T-016: Article Loading — DONE. try/catch, skips missing index.md.
- T-018: Category Pages — DONE. GET /category/:slug with empty state.
- T-019: Tag Pages — DONE. GET /tag/:slug with empty state.
- T-020: Search — DONE. GET /search?q= relevance-ranked case-insensitive.
- T-021: OAuth Login Redirect — DONE. GET /auth/login → Patreon.
- T-028: SEO Meta Tags — DONE. title, description, og:* on all pages.
- Build P, Tests P. Next: T-003, T-005, T-009, T-017, T-022, T-024, T-029
