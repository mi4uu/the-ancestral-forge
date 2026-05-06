---
created: "2026-05-06"
last_edited: "2026-05-06"
---

# Cavekit: Community

## Scope

Patron-only commenting on articles. Comments are visible to all visitors but only authenticated patrons can post them. Comments are stored on the filesystem, scoped per article, and include basic moderation capabilities.

This kit covers comment submission, display, persistence, moderation, and content safety. It does not cover threaded replies, reactions, comment editing, or notifications.

## Requirements

### R1: Comment Submission

**Description:** Authenticated patrons can post comments on any article. Non-patrons and anonymous visitors can read comments but cannot submit them. The UI clearly communicates why the form is or is not available.

**Acceptance Criteria:**

- [ ] A comment submission form is displayed below article content for users whose session indicates isLoggedIn: true and isPatron: true.
- [ ] The comment form is not displayed for users who are logged in but not patrons — instead, a message explains that commenting is a patron benefit.
- [ ] The comment form is not displayed for anonymous (not logged in) visitors — instead, a prompt to log in via Patreon is shown.
- [ ] Submitting a comment with a non-empty body creates the comment and associates it with the current article and the submitting user.
- [ ] Submitting a comment with an empty body is rejected with a validation message.
- [ ] After successful submission, the new comment is immediately visible on the page.

**Dependencies:** Auth R4 (isLoggedIn, isPatron, displayName from user context). Content R1 (articles as comment context).

---

### R2: Comment Display

**Description:** All comments on an article are publicly visible to all visitors. Comments show the author, timestamp, and body, and are ordered chronologically.

**Acceptance Criteria:**

- [ ] All comments for an article are displayed below the article content, visible to all visitors regardless of authentication status.
- [ ] Each comment displays: the author's display name, the timestamp of submission, and the comment body.
- [ ] Comments are ordered chronologically, oldest first.
- [ ] An article with no comments displays a contextual empty state: "Be the first to comment" for patrons, or a comment count of zero for non-patrons and anonymous visitors.

**Dependencies:** R1 (comments must exist to be displayed). Auth R4 (user context for conditional empty state messaging).

---

### R3: Comment Storage

**Description:** Comments are persisted to the filesystem so they survive server restarts. Comments are scoped to the article they belong to.

**Acceptance Criteria:**

- [ ] Comments submitted through the comment form are written to persistent storage on the filesystem.
- [ ] Comments survive a full server restart — restarting the server and loading an article page shows previously submitted comments.
- [ ] Comments are stored in a way that is scoped per article (identifiable by article slug) — loading comments for one article does not load comments for another.
- [ ] If the storage location is inaccessible or write fails, the user receives an error message and the server does not crash.

**Dependencies:** Content R2 (article slug for scoping).

---

### R4: Comment Moderation

**Description:** A designated administrator can delete comments. The admin is identified by a configurable identifier in Site configuration.

**Acceptance Criteria:**

- [ ] Site configuration contains a field for specifying one or more admin identifiers (e.g., Patreon user IDs).
- [ ] A user whose identity matches a configured admin identifier sees a delete action on each comment.
- [ ] Activating the delete action removes the comment from display and from storage.
- [ ] Non-admin users (including patrons) do not see or have access to the delete action.
- [ ] Attempting to delete a comment without admin privileges is rejected.

**Dependencies:** Site R1 (admin identifier in configuration). Auth R4 (user identity for admin check).

---

### R5: Content Safety

**Description:** Comment content is sanitized before rendering to prevent cross-site scripting and other injection attacks. Links are rendered safely.

**Acceptance Criteria:**

- [ ] HTML tags in comment bodies are escaped when rendered — they display as literal text, not as interpreted HTML.
- [ ] Script tags and event handler attributes in comment bodies do not execute.
- [ ] URLs in comment bodies are rendered as clickable hyperlinks.
- [ ] Rendered links from comments open in a new tab/window and include rel="noopener" to prevent tab-nabbing.
- [ ] Comment author display names are also escaped to prevent injection through Patreon display names.

**Dependencies:** None.

## Out of Scope

- Threaded or nested replies — comments are a flat list.
- Upvotes, downvotes, or reactions on comments.
- Editing previously submitted comments.
- Email or push notifications for new comments.
- Rich text formatting in comments (bold, italic, etc.) — comments are plain text with link detection.
- Spam filtering or rate limiting.

## Cross-References

- Depends on **Auth** (cavekit-auth.md): patron status and user identity for submission rights and admin checks (Auth R4).
- Depends on **Content** (cavekit-content.md): articles provide the context for comments; article slug scopes comment storage (Content R1, R2).
- Depends on **Site** (cavekit-site.md): admin identifier configuration for moderation (Site R1).
