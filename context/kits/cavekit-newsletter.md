---
created: "2026-05-07"
last_edited: "2026-05-07"
---

# Cavekit: Newsletter

## Scope

Email newsletter subscription: collecting subscribers, sending welcome emails, providing an unsubscribe mechanism, and UI feedback for subscribe actions. Email delivery uses Resend API. Subscriber data is stored in a filesystem-backed JSON file.

This kit does not cover scheduled/automated weekly dispatch sending, email template editors, or analytics dashboards.

## Requirements

### R1: Subscribe Endpoint

**Description:** A POST endpoint accepts an email address from the newsletter form, validates it, stores it in persistent subscriber storage, and sends a welcome email via Resend. Duplicate emails are silently accepted (no error shown to user) but not stored twice.

**Acceptance Criteria:**

- [ ] POST /subscribe accepts form data with an "email" field.
- [ ] Invalid email addresses (empty, malformed) redirect to homepage with an error indicator.
- [ ] Valid new emails are stored in data/subscribers.json with email and timestamp.
- [ ] Duplicate emails are not added again — the subscriber list has no duplicates.
- [ ] After successful subscribe, a welcome email is sent via Resend API.
- [ ] If Resend API key is missing or send fails, the subscriber is still stored (email failure is non-blocking).
- [ ] After subscribe (success or duplicate), user is redirected to homepage with a success indicator.

**Dependencies:** Site R1 (Resend API key in environment).

---

### R2: Subscribe UI Feedback

**Description:** The homepage newsletter form provides visual feedback after subscribe attempts. Success shows a confirmation message. Error shows an error message. The form itself must prevent empty submissions client-side.

**Acceptance Criteria:**

- [ ] When redirected with ?subscribed=1, a visible success message appears near the newsletter form (e.g., "You're in! Check your inbox.").
- [ ] When redirected with ?subscribe_error=1, a visible error message appears (e.g., "Please enter a valid email.").
- [ ] The newsletter form input has the HTML "required" attribute to prevent empty submissions.
- [ ] Success/error messages are styled consistently with the site's design system.
- [ ] Messages auto-dismiss or are dismissible — they do not permanently alter the page.

**Dependencies:** R1, Site R3 (palette tokens for message styling).

---

### R3: Unsubscribe

**Description:** Subscribers can remove themselves from the list. Every email sent includes an unsubscribe link with a signed token. Clicking it removes the subscriber and shows a confirmation page.

**Acceptance Criteria:**

- [ ] GET /unsubscribe?token={signed_token} removes the subscriber matching the token's email from data/subscribers.json.
- [ ] The unsubscribe token is HMAC-signed so users cannot unsubscribe arbitrary emails.
- [ ] After successful unsubscribe, a confirmation page is displayed ("You've been unsubscribed.").
- [ ] If the token is invalid or the email is not found, a generic message is shown (no error details leaked).
- [ ] The welcome email includes an unsubscribe link with a valid signed token.
- [ ] The unsubscribe link uses the site's configured base URL (not hardcoded).

**Dependencies:** R1 (subscriber storage), Auth magic-link module (HMAC signing pattern reusable).

---

### R4: Subscriber Count

**Description:** The site displays an approximate subscriber count. The count combines the real subscriber count from storage with a configured base number for social proof.

**Acceptance Criteria:**

- [ ] An API endpoint GET /api/subscriber-count returns JSON with the display count.
- [ ] The display count is the sum of the configured base count and real subscriber count from storage.
- [ ] The homepage renders the subscriber count in the header eyebrow and newsletter section.
- [ ] The count updates without page reload (client-side fetch on page load).

**Dependencies:** R1 (subscriber storage), Site R1 (base count configuration).

## Out of Scope

- Automated weekly dispatch (cron-based email sending).
- Email template builder or WYSIWYG editor.
- Analytics (open rates, click rates).
- Double opt-in (single opt-in is sufficient for this MVP).
- Import/export subscriber lists.

## Cross-References

- Depends on **Site** (cavekit-site.md): Resend API key, base subscriber count, base URL.
- Reuses patterns from **Auth** (cavekit-auth.md): HMAC token signing for unsubscribe links.
- Newsletter form is rendered by **Content** templates (cavekit-content.md) on the homepage.
