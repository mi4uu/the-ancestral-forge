/**
 * Magic link authentication.
 * Generates time-limited tokens sent via email. User clicks → logged in.
 */

import { createHmac } from "node:crypto";

const SECRET = process.env.MAGIC_LINK_SECRET || "dev-secret-change-me";
const LINK_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

interface MagicLinkPayload {
  email: string;
  exp: number;
}

/**
 * Generate a magic link token for an email address.
 */
export function generateMagicToken(email: string): string {
  const payload: MagicLinkPayload = {
    email: email.toLowerCase().trim(),
    exp: Date.now() + LINK_EXPIRY_MS,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

/**
 * Verify a magic link token. Returns the email if valid, null if expired/invalid.
 */
export function verifyMagicToken(token: string): string | null {
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;

  // Verify signature
  const expectedSig = createHmac("sha256", SECRET).update(data).digest("base64url");
  if (sig !== expectedSig) return null;

  // Decode and check expiry
  try {
    const payload: MagicLinkPayload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (Date.now() > payload.exp) return null;
    return payload.email;
  } catch {
    return null;
  }
}

/**
 * Send a magic link email via Resend.
 */
export async function sendMagicLinkEmail(email: string, magicUrl: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[auth] No RESEND_API_KEY set");
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "The Ancestral Forge <noreply@ancestralforge.org>",
        to: [email],
        subject: "Your login link — The Ancestral Forge",
        html: `
          <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
            <h2 style="color: #1A2F24; margin-bottom: 20px;">Sign in to The Ancestral Forge</h2>
            <p style="color: #5C6B5F; line-height: 1.6;">Click the link below to sign in. This link expires in 15 minutes.</p>
            <a href="${magicUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background: #1A2F24; color: #F5EFE0; text-decoration: none; font-size: 14px; letter-spacing: 0.1em;">SIGN IN →</a>
            <p style="color: #5C6B5F; font-size: 13px; line-height: 1.6;">If you didn't request this link, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #E0DCD5; margin: 30px 0;"/>
            <p style="color: #5C6B5F; font-size: 11px;">The Ancestral Forge · ancestralforge.org</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[auth] Resend error:", err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[auth] Failed to send email:", err);
    return false;
  }
}
