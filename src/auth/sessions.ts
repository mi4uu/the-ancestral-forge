import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export interface SessionData {
  userId: string;
  displayName: string;
  isPatron: boolean;
  createdAt: number;
  expiresAt: number;
  lastPledgeCheck?: number;
}

export const SESSION_COOKIE_NAME = "taf_session";
export const DEFAULT_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

const SESSIONS_FILE = "data/sessions.json";
const sessions = new Map<string, SessionData>();

async function persist(): Promise<void> {
  const dir = dirname(SESSIONS_FILE);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  const obj = Object.fromEntries(sessions);
  await writeFile(SESSIONS_FILE, JSON.stringify(obj, null, 2));
}

export async function loadSessions(): Promise<void> {
  if (!existsSync(SESSIONS_FILE)) return;
  try {
    const text = await readFile(SESSIONS_FILE, "utf-8");
    const obj = JSON.parse(text) as Record<string, SessionData>;
    sessions.clear();
    for (const [token, data] of Object.entries(obj)) {
      sessions.set(token, data);
    }
  } catch {
    sessions.clear();
  }
}

export async function createSession(
  data: Omit<SessionData, "createdAt" | "expiresAt">,
  durationMs: number = DEFAULT_SESSION_DURATION_MS,
): Promise<string> {
  const token = crypto.randomUUID();
  const now = Date.now();
  sessions.set(token, { ...data, createdAt: now, expiresAt: now + durationMs });
  await persist();
  return token;
}

export async function getSession(token: string): Promise<SessionData | null> {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    await persist();
    return null;
  }
  return session;
}

export async function updateSession(
  token: string,
  updates: Partial<Omit<SessionData, "createdAt" | "expiresAt">>,
): Promise<boolean> {
  const session = sessions.get(token);
  if (!session || Date.now() > session.expiresAt) return false;
  Object.assign(session, updates);
  await persist();
  return true;
}

export async function destroySession(token: string): Promise<void> {
  sessions.delete(token);
  await persist();
}

// Load on import
await loadSessions();
