---
created: "2026-05-06"
last_edited: "2026-05-06"
---

# Cavekit: Vault

## Scope

Paywall logic — determining which articles are gated, enforcing access control, and presenting the appropriate UI for locked and unlocked states. Vault does not handle payments or authentication; it consumes patron status from Auth and article metadata from Content.

This kit covers the decision layer ("should this user see this content?") and the presentation contract ("what does a locked article look like?"). It does not cover payment processing, tiered access levels, or offline/download access.

## Requirements

### R1: Time-Based Paywall

**Description:** Articles published within a configurable window (defaulting to 30 days) are paywalled. After the window expires, articles become publicly accessible automatically. No manual intervention is required to unlock aged content.

**Acceptance Criteria:**

- [ ] An article published today (within the paywall window) is not accessible in full to non-patron visitors.
- [ ] An article published more than 30 days ago (outside the default paywall window) is accessible in full to all visitors.
- [ ] The paywall window duration is configurable in Site configuration.
- [ ] Changing the paywall window duration in configuration changes which articles are gated — no code changes required.
- [ ] The paywall decision is based on the article's date field from frontmatter compared to the current date.

**Dependencies:** Content R2 (article date from frontmatter). Site R1 (paywall window duration in config).

---

### R2: Patron Access

**Description:** Logged-in users with an active patron status bypass the paywall entirely. They see full article content regardless of publication date.

**Acceptance Criteria:**

- [ ] A user whose session indicates isPatron: true can view the full content of any article, including those within the paywall window.
- [ ] A user whose session indicates isPatron: false, or who is not logged in, cannot view the full content of articles within the paywall window.
- [ ] Patron access is determined solely by the Auth user context — Vault does not independently verify pledge status.

**Dependencies:** Auth R4 (isPatron from user context).

---

### R3: Paywall UI State

**Description:** Gated articles present a clear but non-intrusive locked state. The user can see enough to understand what the article is about, with a prompt to gain access. Article listings remain fully browsable — gating does not hide articles from discovery.

**Acceptance Criteria:**

- [ ] A gated article page (viewed by a non-patron) displays: the article excerpt, the illustration (if present), and all metadata (title, author, date, category, tags, read time).
- [ ] Below the visible excerpt of a gated article, a paywall message is displayed with a call-to-action directing the user to Patreon.
- [ ] The full article body is not present in the page source for gated articles viewed by non-patrons — it is not merely hidden with CSS.
- [ ] On listing pages (home, category, tag, search results), gated articles appear alongside public articles but display a lock indicator.
- [ ] Gated articles on listing pages remain clickable and navigable — the lock indicator is informational, not blocking.

**Dependencies:** Content R2 (article metadata and excerpt). Auth R4 (user context for conditional rendering).

---

### R4: Vault Override

**Description:** Individual articles can opt out of the paywall by setting a flag in their frontmatter. Overridden articles are always public regardless of their publication date.

**Acceptance Criteria:**

- [ ] An article with free: true in its frontmatter is accessible in full to all visitors regardless of publication date.
- [ ] An article without the free flag, or with free: false, follows the standard time-based paywall rule from R1.
- [ ] The free flag is per-article — setting it on one article does not affect any other article.

**Dependencies:** Content R2 (free flag in frontmatter).

## Out of Scope

- Payment processing — Patreon handles all payments.
- Tiered access — there is a single access tier (patron/non-patron).
- Download or offline access to gated content.
- A separate members-only archive or section — gating is per-article based on age.
- Email-gated or registration-gated access (access is Patreon-only).

## Cross-References

- Depends on **Auth** (cavekit-auth.md): patron status from user context (Auth R4).
- Depends on **Content** (cavekit-content.md): article date and free flag from frontmatter (Content R2).
- Depends on **Site** (cavekit-site.md): paywall window duration configuration (Site R1).
- Consumed by **Content** (cavekit-content.md): RSS feed respects Vault paywall rules (Content R5).
