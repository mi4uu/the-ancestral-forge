# Implementation Tracking: Newsletter

Build site: context/plans/build-site-newsletter.md

| Task | Status | Notes |
|------|--------|-------|
| T-N-001 | DONE | Audit passed — all 7 R1 ACs met in existing code |
| T-N-002 | DONE | Success/error banners on homepage, auto-dismiss after 6s, replaceState strips params |
| T-N-003 | DONE | Verified — required attr present on all newsletter form inputs |
| T-N-004 | DONE | generateUnsubscribeToken, verifyUnsubscribeToken, generateUnsubscribeUrl added |
| T-N-005 | DONE | removeSubscriber — case-insensitive filter + save |
| T-N-006 | DONE | GET /unsubscribe endpoint + renderUnsubscribe confirmation/error pages |
| T-N-007 | DONE | Welcome email has unsubscribe link + List-Unsubscribe header |
| T-N-008 | DONE | /api/subscriber-count uses config base + local getSubscriberCount() |
| T-N-009 | DONE | Verified — client-side fetch uses d.display, compatible with new response |
