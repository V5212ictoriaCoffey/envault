import * as fs from "fs";
import * as path from "path";

export interface TTLEntry {
  key: string;
  ttlSeconds: number;
  createdAt: string;
}

export interface TTLStore {
  [key: string]: TTLEntry;
}

export function getTTLPath(vaultDir: string): string {
  return path.join(vaultDir, ".envault", "ttl.json");
}

export function loadTTLStore(vaultDir: string): TTLStore {
  const filePath = getTTLPath(vaultDir);
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as TTLStore;
}

export function saveTTLStore(vaultDir: string, store: TTLStore): void {
  const filePath = getTTLPath(vaultDir);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function setTTL(vaultDir: string, key: string, ttlSeconds: number): TTLEntry {
  const store = loadTTLStore(vaultDir);
  const entry: TTLEntry = {
    key,
    ttlSeconds,
    createdAt: new Date().toISOString(),
  };
  store[key] = entry;
  saveTTLStore(vaultDir, store);
  return entry;
}

export function removeTTL(vaultDir: string, key: string): boolean {
  const store = loadTTLStore(vaultDir);
  if (!store[key]) return false;
  delete store[key];
  saveTTLStore(vaultDir, store);
  return true;
}

export function getTTL(vaultDir: string, key: string): TTLEntry | null {
  const store = loadTTLStore(vaultDir);
  return store[key] ?? null;
}

export function isExpired(entry: TTLEntry): boolean {
  const createdAt = new Date(entry.createdAt).getTime();
  const expiresAt = createdAt + entry.ttlSeconds * 1000;
  return Date.now() > expiresAt;
}

export function listExpiredKeys(vaultDir: string): string[] {
  const store = loadTTLStore(vaultDir);
  return Object.values(store)
    .filter(isExpired)
    .map((e) => e.key);
}
