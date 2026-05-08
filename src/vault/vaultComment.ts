import fs from "fs";
import path from "path";

export interface CommentStore {
  [key: string]: string;
}

export function getCommentPath(vaultDir: string): string {
  return path.join(vaultDir, ".envault-comments.json");
}

export function loadCommentStore(vaultDir: string): CommentStore {
  const filePath = getCommentPath(vaultDir);
  if (!fs.existsSync(filePath)) return {};
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as CommentStore;
  } catch {
    return {};
  }
}

export function saveCommentStore(vaultDir: string, store: CommentStore): void {
  const filePath = getCommentPath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function setComment(vaultDir: string, key: string, comment: string): void {
  const store = loadCommentStore(vaultDir);
  store[key] = comment;
  saveCommentStore(vaultDir, store);
}

export function removeComment(vaultDir: string, key: string): boolean {
  const store = loadCommentStore(vaultDir);
  if (!(key in store)) return false;
  delete store[key];
  saveCommentStore(vaultDir, store);
  return true;
}

export function getComment(vaultDir: string, key: string): string | undefined {
  const store = loadCommentStore(vaultDir);
  return store[key];
}

export function listComments(vaultDir: string): CommentStore {
  return loadCommentStore(vaultDir);
}
