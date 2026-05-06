---
created: "2026-05-06"
last_edited: "2026-05-06"
---

# Cavekit: Auth

## Scope

Patreon OAuth login and logout, session management, and pledge status verification. This domain provides the identity and authorization layer that Vault and Community consume. It answers three questions for every request: is the user logged in, what is their display name, and are they an active patron.

This kit does not handle payments, user registration outside Patreon, or any role system beyond the patron/non-patron distinction.

## Requirements

### R1: Patreon OAuth Flow

**Description:** Users authenticate by logging in through Patreon's OAuth 2.0 authorization flow. The site redirects to Patreon, receives an authorization grant, exchanges it for an access token, and retrieves the user's identity and pledge information.

**Acceptance Criteria:**

- [ ] Initiating login redirects the user's browser to Patreon's authorization endpoint with appropriate scopes requested.
- [ ] After the user approves access on Patreon, Patreon redirects back to the site's callback path.
- [ ] On successful callback, a session is created for the user and they are redirected to the page they came from (or the home page as fallback).
- [ ] If the user denies access or Patreon returns an error, the user is returned to the site with a visible error message — no server crash or unhandled exception.
- [ ] If the token exchange with Patreon fails (network error, invalid response), the user sees an error message and is not left in a broken state.

**Dependencies:** Site R1 (callback URL, Patreon credentials stored in config or environment).

---

### R2: Session Management

**Description:** Authenticated users maintain a persistent session across requests. Sessions have a configurable expiration and can be explicitly destroyed via logout.

**Acceptance Criteria:**

- [ ] After successful login, the user's authenticated state persists across subsequent page loads without re-authenticating.
- [ ] Sessions are maintained via a browser cookie.
- [ ] Sessions expire after a configurable duration (defaulting to 30 days if not configured).
- [ ] Accessing the logout action destroys the session — subsequent requests from the same browser are unauthenticated.
- [ ] Expired sessions are treated as unauthenticated — the user must log in again.
- [ ] Session tokens are not predictable or enumerable (cryptographically random).

**Dependencies:** None.

---

### R3: Pledge Verification

**Description:** The system verifies whether a logged-in user has an active Patreon pledge at or above the minimum tier threshold. Pledge status is cached in the session and refreshed periodically.

**Acceptance Criteria:**

- [ ] A user with an active Patreon pledge of $3 or more is marked as a patron in their session.
- [ ] A user with no pledge, a pledge below $3, or a cancelled/declined pledge is not marked as a patron.
- [ ] The minimum pledge threshold ($3) is configurable in Site configuration.
- [ ] Pledge status is refreshed periodically (not on every single request) to detect changes — the refresh interval is configurable.
- [ ] Between refreshes, the cached pledge status is used for access decisions.
- [ ] If a pledge status refresh fails (Patreon API unavailable), the previously cached status is retained and a warning is logged.

**Dependencies:** Site R1 (minimum pledge threshold configuration).

---

### R4: User Context

**Description:** Authentication state is available as request context on every route. All routes can inspect login status, patron status, and display name without coupling to the authentication mechanism.

**Acceptance Criteria:**

- [ ] Every route has access to a user context that includes: isLoggedIn (boolean), isPatron (boolean), and displayName (string or null).
- [ ] For unauthenticated requests, isLoggedIn is false, isPatron is false, and displayName is null.
- [ ] For authenticated non-patron requests, isLoggedIn is true, isPatron is false, and displayName is the user's Patreon display name.
- [ ] For authenticated patron requests, isLoggedIn is true, isPatron is true, and displayName is the user's Patreon display name.
- [ ] Pages that feature patron-only functionality show a login prompt to unauthenticated users in place of that functionality.

**Dependencies:** R1, R2, R3.

## Out of Scope

- User registration independent of Patreon.
- Password-based or email-based authentication.
- Role-based permissions beyond the single patron/non-patron distinction.
- User profile pages or account management.
- Storing user data beyond what is needed for session and pledge verification.

## Cross-References

- Consumed by **Vault** (cavekit-vault.md): patron status determines paywall bypass (Vault R2).
- Consumed by **Community** (cavekit-community.md): patron status determines comment submission rights (Community R1), user identity for comment attribution (Community R2).
- Depends on **Site** (cavekit-site.md): minimum pledge threshold and session duration configuration.
