import * as fs from "fs";
import * as path from "path";

export interface LockEntry {
  lockedAt: string;
  lockedBy: string;
  reason?: string;
}

export interface LockStore {
  [key: string]: LockEntry;
}

export function getLockPath(vaultDir: string): string {
  return path.join(vaultDir, ".vault-locks.json");
}

export function loadLockStore(vaultDir: string): LockStore {
  const lockPath = getLockPath(vaultDir);
  if (!fs.existsSync(lockPath)) return {};
  const raw = fs.readFileSync(lockPath, "utf-8");
  return JSON.parse(raw) as LockStore;
}

export function saveLockStore(vaultDir: string, store: LockStore): void {
  const lockPath = getLockPath(vaultDir);
  fs.writeFileSync(lockPath, JSON.stringify(store, null, 2), "utf-8");
}

export function lockKey(
  vaultDir: string,
  key: string,
  lockedBy: string,
  reason?: string
): LockStore {
  const store = loadLockStore(vaultDir);
  if (store[key]) {
    throw new Error(`Key "${key}" is already locked by ${store[key].lockedBy}`);
  }
  store[key] = {
    lockedAt: new Date().toISOString(),
    lockedBy,
    ...(reason ? { reason } : {}),
  };
  saveLockStore(vaultDir, store);
  return store;
}

export function unlockKey(vaultDir: string, key: string): LockStore {
  const store = loadLockStore(vaultDir);
  if (!store[key]) {
    throw new Error(`Key "${key}" is not locked`);
  }
  delete store[key];
  saveLockStore(vaultDir, store);
  return store;
}

export function isKeyLocked(vaultDir: string, key: string): boolean {
  const store = loadLockStore(vaultDir);
  return key in store;
}

export function listLockedKeys(vaultDir: string): Array<{ key: string } & LockEntry> {
  const store = loadLockStore(vaultDir);
  return Object.entries(store).map(([key, entry]) => ({ key, ...entry }));
}
