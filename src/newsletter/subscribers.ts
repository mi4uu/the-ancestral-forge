/**
 * Newsletter subscriber storage — filesystem-backed JSON.
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

interface Subscriber {
  email: string;
  subscribedAt: number;
}

const SUBS_FILE = "data/subscribers.json";

async function load(): Promise<Subscriber[]> {
  if (!existsSync(SUBS_FILE)) return [];
  try {
    return JSON.parse(await readFile(SUBS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

async function save(subs: Subscriber[]): Promise<void> {
  const dir = dirname(SUBS_FILE);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  await writeFile(SUBS_FILE, JSON.stringify(subs, null, 2));
}

/**
 * Add subscriber. Returns false if already subscribed.
 */
export async function addSubscriber(email: string): Promise<boolean> {
  const subs = await load();
  const lower = email.toLowerCase().trim();
  if (subs.some((s) => s.email === lower)) return false;
  subs.push({ email: lower, subscribedAt: Date.now() });
  await save(subs);
  return true;
}

/**
 * Get subscriber count.
 */
export async function getSubscriberCount(): Promise<number> {
  return (await load()).length;
}

/**
 * Send welcome email via Resend.
 */
export async function sendWelcomeEmail(email: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

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
        subject: "Welcome to The Ancestral Forge",
        html: `
          <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
            <h2 style="color: #1A2F24; margin-bottom: 20px;">Welcome to The Ancestral Forge</h2>
            <p style="color: #5C6B5F; line-height: 1.6;">You're now subscribed to our weekly transmission. One piece of lost botanical knowledge or survival engineering — sent to your inbox every week.</p>
            <p style="color: #5C6B5F; line-height: 1.6;">No spam. No clickbait. Just the truth.</p>
            <hr style="border: none; border-top: 1px solid #E0DCD5; margin: 30px 0;"/>
            <p style="color: #5C6B5F; font-size: 11px;">The Ancestral Forge · ancestralforge.org</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      console.error("[newsletter] Resend error:", await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[newsletter] Failed to send welcome:", err);
    return false;
  }
}
