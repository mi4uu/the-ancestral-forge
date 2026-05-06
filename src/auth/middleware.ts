/**
 * Auth middleware — attaches user context to every request.
 */

import { getSession, SESSION_COOKIE_NAME, updateSession } from "./sessions";
import { fetchPatreonUser } from "./patreon";
import { getConfig } from "../config";

export interface UserContext {
  isLoggedIn: boolean;
  isPatron: boolean;
  displayName: string | null;
  userId: string | null;
}

const PLEDGE_REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Extract user context from request cookies.
 * Returns unauthenticated context if no valid session.
 */
export async function getUserContext(cookieHeader: string | null | undefined): Promise<UserContext> {
  const unauth: UserContext = { isLoggedIn: false, isPatron: false, displayName: null, userId: null };
  if (!cookieHeader) return unauth;

  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  if (!match) return unauth;

  const session = await getSession(match[1]);
  if (!session) return unauth;

  // Periodic pledge refresh (T-025)
  const now = Date.now();
  if (session.lastPledgeCheck && now - session.lastPledgeCheck > PLEDGE_REFRESH_INTERVAL_MS) {
    // Don't block request — fire and forget
    // If refresh fails, retain cached status
    try {
      // Would need stored access token for refresh — skip for now, use cached
      await updateSession(match[1], { lastPledgeCheck: now });
    } catch {
      console.warn("[auth] Pledge refresh failed, using cached status");
    }
  }

  return {
    isLoggedIn: true,
    isPatron: session.isPatron,
    displayName: session.displayName,
    userId: session.userId,
  };
}
