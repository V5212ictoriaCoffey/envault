import fs from "fs";
import path from "path";

export interface ExpiryStore {
  [key: string]: string; // ISO date string
}

export function getExpiryPath(vaultDir: string): string {
  return path.join(vaultDir, ".vault-expiry.json");
}

export function loadExpiryStore(vaultDir: string): ExpiryStore {
  const p = getExpiryPath(vaultDir);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

export function saveExpiryStore(vaultDir: string, store: ExpiryStore): void {
  fs.writeFileSync(getExpiryPath(vaultDir), JSON.stringify(store, null, 2));
}

export function setExpiry(vaultDir: string, key: string, expiresAt: Date): void {
  const store = loadExpiryStore(vaultDir);
  store[key] = expiresAt.toISOString();
  saveExpiryStore(vaultDir, store);
}

export function removeExpiry(vaultDir: string, key: string): void {
  const store = loadExpiryStore(vaultDir);
  delete store[key];
  saveExpiryStore(vaultDir, store);
}

export function getExpiry(vaultDir: string, key: string): Date | null {
  const store = loadExpiryStore(vaultDir);
  if (!store[key]) return null;
  return new Date(store[key]);
}

export function isExpired(vaultDir: string, key: string): boolean {
  const expiry = getExpiry(vaultDir, key);
  if (!expiry) return false;
  return new Date() > expiry;
}

export function listExpiredKeys(vaultDir: string): string[] {
  const store = loadExpiryStore(vaultDir);
  const now = new Date();
  return Object.entries(store)
    .filter(([, iso]) => new Date(iso) < now)
    .map(([key]) => key);
}

export function listExpiryEntries(vaultDir: string): Array<{ key: string; expiresAt: Date; expired: boolean }> {
  const store = loadExpiryStore(vaultDir);
  const now = new Date();
  return Object.entries(store).map(([key, iso]) => {
    const expiresAt = new Date(iso);
    return { key, expiresAt, expired: expiresAt < now };
  });
}
