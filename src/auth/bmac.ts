/**
 * Buy Me a Coffee API integration.
 * Checks membership status by email against active subscribers.
 */

const BMAC_API_BASE = "https://developers.buymeacoffee.com/api/v1";

interface BmacMember {
  subscription_id: number;
  payer_email: string;
  payer_name: string;
  subscription_coffee_price: string;
  subscription_is_cancelled: string | null;
  subscription_current_period_end: string;
  subscription_duration_type: string;
}

interface BmacResponse {
  data: BmacMember[];
  current_page: number;
  last_page: number;
  next_page_url: string | null;
}

/**
 * Check if an email is an active BMaC subscriber.
 * Returns the member data if found, null otherwise.
 */
export async function checkMembership(email: string): Promise<{ isPatron: boolean; name: string } | null> {
  const token = process.env.BMAC_API_TOKEN;
  if (!token) {
    console.warn("[bmac] No BMAC_API_TOKEN set");
    return null;
  }

  try {
    let page = 1;
    const lowerEmail = email.toLowerCase();

    while (true) {
      const res = await fetch(`${BMAC_API_BASE}/subscriptions?status=active&page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 404) return { isPatron: false, name: "" };
        console.error(`[bmac] API error: ${res.status}`);
        return null;
      }

      const data = await res.json() as BmacResponse;

      if (!data.data || data.data.length === 0) {
        return { isPatron: false, name: "" };
      }

      for (const member of data.data) {
        if (member.payer_email?.toLowerCase() === lowerEmail) {
          return { isPatron: true, name: member.payer_name || email };
        }
      }

      if (!data.next_page_url) break;
      page++;
    }

    return { isPatron: false, name: "" };
  } catch (err) {
    console.error("[bmac] Failed to check membership:", err);
    return null;
  }
}
