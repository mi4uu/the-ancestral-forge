/**
 * Patreon OAuth integration.
 * Handles login redirect, callback, token exchange, and pledge verification.
 */

import { getConfig } from "../config";

const PATREON_AUTH_URL = "https://www.patreon.com/oauth2/authorize";
const PATREON_TOKEN_URL = "https://www.patreon.com/api/oauth2/token";
const PATREON_IDENTITY_URL = "https://www.patreon.com/api/oauth2/v2/identity";

export function getLoginRedirectUrl(returnTo?: string): string {
  const cfg = getConfig();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: cfg.patreon.clientId,
    redirect_uri: cfg.patreon.callbackUrl,
    scope: "identity identity[email] campaigns.members",
  });
  if (returnTo) {
    params.set("state", returnTo);
  }
  return `${PATREON_AUTH_URL}?${params.toString()}`;
}

export interface PatreonTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
}

export async function exchangeCodeForToken(code: string): Promise<PatreonTokenResponse> {
  const cfg = getConfig();
  const res = await fetch(PATREON_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: cfg.patreon.clientId,
      client_secret: cfg.patreon.clientSecret,
      redirect_uri: cfg.patreon.callbackUrl,
    }),
  });
  if (!res.ok) {
    throw new Error(`Patreon token exchange failed: ${res.status}`);
  }
  return res.json();
}

export interface PatreonUser {
  id: string;
  displayName: string;
  email?: string;
  isPatron: boolean;
  pledgeAmountCents: number;
}

export async function fetchPatreonUser(accessToken: string): Promise<PatreonUser> {
  const cfg = getConfig();
  const url = `${PATREON_IDENTITY_URL}?include=memberships.campaign&fields[user]=full_name,email&fields[member]=patron_status,currently_entitled_amount_cents`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Patreon identity fetch failed: ${res.status}`);
  }
  const data = await res.json();
  const user = data.data;
  const memberships = data.included?.filter((i: any) => i.type === "member") || [];

  let isPatron = false;
  let pledgeAmountCents = 0;

  for (const m of memberships) {
    const status = m.attributes?.patron_status;
    const cents = m.attributes?.currently_entitled_amount_cents || 0;
    if (status === "active_patron" && cents >= cfg.minPledgeThreshold * 100) {
      isPatron = true;
      pledgeAmountCents = cents;
    }
  }

  return {
    id: user.id,
    displayName: user.attributes?.full_name || "Patron",
    email: user.attributes?.email,
    isPatron,
    pledgeAmountCents,
  };
}

export function checkPledgeMeetsThreshold(amountCents: number): boolean {
  const cfg = getConfig();
  return amountCents >= cfg.minPledgeThreshold * 100;
}
