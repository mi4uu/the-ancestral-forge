/**
 * Vault — paywall decision logic.
 * Determines which articles are gated based on publication date and config.
 */

import type { Article } from "../content";
import { getConfig } from "../config";

export interface UserContext {
  isLoggedIn: boolean;
  isPatron: boolean;
  displayName: string | null;
}

/**
 * Is this article currently behind the paywall?
 * True if published within the paywall window and not marked free.
 */
export function isArticleGated(article: Article): boolean {
  if (article.free) return false;
  const cfg = getConfig();
  const publishDate = new Date(article.date).getTime();
  const windowMs = cfg.paywallWindowDays * 24 * 60 * 60 * 1000;
  return Date.now() - publishDate < windowMs;
}

/**
 * Can this user access the full article content?
 * Patrons bypass the paywall. Everyone else sees gated articles as locked.
 */
export function canUserAccessArticle(article: Article, user: UserContext): boolean {
  if (user.isPatron) return true;
  return !isArticleGated(article);
}
