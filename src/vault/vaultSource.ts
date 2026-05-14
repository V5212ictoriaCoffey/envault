import * as fs from "fs";
import * as path from "path";

export interface SourceEntry {
  key: string;
  source: string;
  addedAt: string;
}

export type SourceStore = Record<string, SourceEntry>;

export function getSourcePath(vaultDir: string): string {
  return path.join(vaultDir, ".envault", "sources.json");
}

export function loadSourceStore(vaultDir: string): SourceStore {
  const filePath = getSourcePath(vaultDir);
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as SourceStore;
}

export function saveSourceStore(vaultDir: string, store: SourceStore): void {
  const filePath = getSourcePath(vaultDir);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function setSource(vaultDir: string, key: string, source: string): SourceEntry {
  const store = loadSourceStore(vaultDir);
  const entry: SourceEntry = { key, source, addedAt: new Date().toISOString() };
  store[key] = entry;
  saveSourceStore(vaultDir, store);
  return entry;
}

export function removeSource(vaultDir: string, key: string): boolean {
  const store = loadSourceStore(vaultDir);
  if (!store[key]) return false;
  delete store[key];
  saveSourceStore(vaultDir, store);
  return true;
}

export function getSource(vaultDir: string, key: string): SourceEntry | undefined {
  const store = loadSourceStore(vaultDir);
  return store[key];
}

export function listSources(vaultDir: string): SourceEntry[] {
  const store = loadSourceStore(vaultDir);
  return Object.values(store);
}

export function getKeysBySource(vaultDir: string, source: string): string[] {
  const store = loadSourceStore(vaultDir);
  return Object.values(store)
    .filter((e) => e.source === source)
    .map((e) => e.key);
}
