import * as fs from "fs";
import * as path from "path";

export interface OwnerEntry {
  key: string;
  owner: string;
  assignedAt: string;
}

export interface OwnerStore {
  [key: string]: OwnerEntry;
}

export function getOwnerPath(vaultDir: string): string {
  return path.join(vaultDir, ".envault-owners.json");
}

export function loadOwnerStore(vaultDir: string): OwnerStore {
  const filePath = getOwnerPath(vaultDir);
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as OwnerStore;
}

export function saveOwnerStore(vaultDir: string, store: OwnerStore): void {
  const filePath = getOwnerPath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function setOwner(vaultDir: string, key: string, owner: string): OwnerEntry {
  const store = loadOwnerStore(vaultDir);
  const entry: OwnerEntry = {
    key,
    owner,
    assignedAt: new Date().toISOString(),
  };
  store[key] = entry;
  saveOwnerStore(vaultDir, store);
  return entry;
}

export function removeOwner(vaultDir: string, key: string): boolean {
  const store = loadOwnerStore(vaultDir);
  if (!store[key]) return false;
  delete store[key];
  saveOwnerStore(vaultDir, store);
  return true;
}

export function getOwner(vaultDir: string, key: string): OwnerEntry | undefined {
  const store = loadOwnerStore(vaultDir);
  return store[key];
}

export function listOwners(vaultDir: string): OwnerEntry[] {
  const store = loadOwnerStore(vaultDir);
  return Object.values(store);
}

export function getKeysByOwner(vaultDir: string, owner: string): string[] {
  const store = loadOwnerStore(vaultDir);
  return Object.values(store)
    .filter((entry) => entry.owner === owner)
    .map((entry) => entry.key);
}
