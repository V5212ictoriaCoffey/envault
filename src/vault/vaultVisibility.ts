import fs from "fs";
import path from "path";

export type VisibilityLevel = "public" | "private" | "secret";

export interface VisibilityStore {
  [key: string]: VisibilityLevel;
}

export function getVisibilityPath(vaultDir: string): string {
  return path.join(vaultDir, ".visibility.json");
}

export function loadVisibilityStore(vaultDir: string): VisibilityStore {
  const filePath = getVisibilityPath(vaultDir);
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function saveVisibilityStore(vaultDir: string, store: VisibilityStore): void {
  const filePath = getVisibilityPath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2));
}

export function setVisibility(vaultDir: string, key: string, level: VisibilityLevel): VisibilityStore {
  const store = loadVisibilityStore(vaultDir);
  store[key] = level;
  saveVisibilityStore(vaultDir, store);
  return store;
}

export function removeVisibility(vaultDir: string, key: string): VisibilityStore {
  const store = loadVisibilityStore(vaultDir);
  delete store[key];
  saveVisibilityStore(vaultDir, store);
  return store;
}

export function getVisibility(vaultDir: string, key: string): VisibilityLevel {
  const store = loadVisibilityStore(vaultDir);
  return store[key] ?? "private";
}

export function listByVisibility(vaultDir: string, level: VisibilityLevel): string[] {
  const store = loadVisibilityStore(vaultDir);
  return Object.entries(store)
    .filter(([, v]) => v === level)
    .map(([k]) => k);
}
