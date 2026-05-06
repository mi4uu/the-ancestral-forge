/**
 * Comment storage — filesystem-backed, per-article JSON files.
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  timestamp: number;
}

const COMMENTS_DIR = "data/comments";

function filePath(slug: string): string {
  return join(COMMENTS_DIR, `${slug}.json`);
}

export async function getComments(slug: string): Promise<Comment[]> {
  const path = filePath(slug);
  if (!existsSync(path)) return [];
  try {
    const text = await readFile(path, "utf-8");
    return JSON.parse(text) as Comment[];
  } catch {
    return [];
  }
}

export async function addComment(slug: string, comment: Omit<Comment, "id" | "timestamp">): Promise<Comment> {
  const comments = await getComments(slug);
  const newComment: Comment = {
    id: crypto.randomUUID(),
    ...comment,
    timestamp: Date.now(),
  };
  comments.push(newComment);

  const path = filePath(slug);
  const dir = dirname(path);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });

  try {
    await writeFile(path, JSON.stringify(comments, null, 2));
  } catch (err) {
    throw new Error(`Failed to write comment: ${err}`);
  }

  return newComment;
}

export async function deleteComment(slug: string, commentId: string): Promise<boolean> {
  const comments = await getComments(slug);
  const filtered = comments.filter((c) => c.id !== commentId);
  if (filtered.length === comments.length) return false;

  const path = filePath(slug);
  try {
    await writeFile(path, JSON.stringify(filtered, null, 2));
    return true;
  } catch {
    return false;
  }
}
