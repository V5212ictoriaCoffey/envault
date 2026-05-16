import * as fs from "fs";
import * as path from "path";

export interface VersionEntry {
  key: string;
  version: number;
  updatedAt: string;
}

export type VersionStore = Record<string, VersionEntry>;

export function getVersionPath(vaultDir: string): string {
  return path.join(vaultDir, ".vault", "versions.json");
}

export function loadVersionStore(vaultDir: string): VersionStore {
  const filePath = getVersionPath(vaultDir);
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as VersionStore;
  } catch {
    return {};
  }
}

export function saveVersionStore(vaultDir: string, store: VersionStore): void {
  const filePath = getVersionPath(vaultDir);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function bumpVersion(vaultDir: string, key: string): VersionEntry {
  const store = loadVersionStore(vaultDir);
  const existing = store[key];
  const entry: VersionEntry = {
    key,
    version: existing ? existing.version + 1 : 1,
    updatedAt: new Date().toISOString(),
  };
  store[key] = entry;
  saveVersionStore(vaultDir, store);
  return entry;
}

export function getVersion(vaultDir: string, key: string): VersionEntry | undefined {
  const store = loadVersionStore(vaultDir);
  return store[key];
}

export function removeVersionEntry(vaultDir: string, key: string): boolean {
  const store = loadVersionStore(vaultDir);
  if (!store[key]) return false;
  delete store[key];
  saveVersionStore(vaultDir, store);
  return true;
}

export function listVersions(vaultDir: string): VersionEntry[] {
  const store = loadVersionStore(vaultDir);
  return Object.values(store).sort((a, b) => b.version - a.version);
}
