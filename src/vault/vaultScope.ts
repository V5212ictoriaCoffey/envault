import * as fs from "fs";
import * as path from "path";

export type ScopeLevel = "local" | "shared" | "global";

export interface ScopeStore {
  [key: string]: ScopeLevel;
}

export function getScopePath(vaultDir: string): string {
  return path.join(vaultDir, ".envault", "scope.json");
}

export function loadScopeStore(vaultDir: string): ScopeStore {
  const scopePath = getScopePath(vaultDir);
  if (!fs.existsSync(scopePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(scopePath, "utf-8"));
  } catch {
    return {};
  }
}

export function saveScopeStore(vaultDir: string, store: ScopeStore): void {
  const scopePath = getScopePath(vaultDir);
  fs.mkdirSync(path.dirname(scopePath), { recursive: true });
  fs.writeFileSync(scopePath, JSON.stringify(store, null, 2));
}

export function setScope(vaultDir: string, key: string, level: ScopeLevel): ScopeStore {
  const store = loadScopeStore(vaultDir);
  store[key] = level;
  saveScopeStore(vaultDir, store);
  return store;
}

export function removeScope(vaultDir: string, key: string): ScopeStore {
  const store = loadScopeStore(vaultDir);
  delete store[key];
  saveScopeStore(vaultDir, store);
  return store;
}

export function getScope(vaultDir: string, key: string): ScopeLevel | undefined {
  return loadScopeStore(vaultDir)[key];
}

export function getKeysByScope(vaultDir: string, level: ScopeLevel): string[] {
  const store = loadScopeStore(vaultDir);
  return Object.entries(store)
    .filter(([, v]) => v === level)
    .map(([k]) => k);
}

export function formatScopeList(store: ScopeStore): string {
  const entries = Object.entries(store);
  if (entries.length === 0) return "No scope assignments found.";
  return entries.map(([k, v]) => `  ${k}: ${v}`).join("\n");
}
