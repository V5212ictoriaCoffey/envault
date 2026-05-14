import fs from "fs";
import path from "path";

export type PriorityLevel = "critical" | "high" | "medium" | "low";

export interface PriorityStore {
  [key: string]: PriorityLevel;
}

export function getPriorityPath(vaultDir: string): string {
  return path.join(vaultDir, ".priority.json");
}

export function loadPriorityStore(vaultDir: string): PriorityStore {
  const filePath = getPriorityPath(vaultDir);
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as PriorityStore;
}

export function savePriorityStore(vaultDir: string, store: PriorityStore): void {
  const filePath = getPriorityPath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function setPriority(
  vaultDir: string,
  key: string,
  level: PriorityLevel
): void {
  const store = loadPriorityStore(vaultDir);
  store[key] = level;
  savePriorityStore(vaultDir, store);
}

export function removePriority(vaultDir: string, key: string): void {
  const store = loadPriorityStore(vaultDir);
  delete store[key];
  savePriorityStore(vaultDir, store);
}

export function getPriority(
  vaultDir: string,
  key: string
): PriorityLevel | undefined {
  const store = loadPriorityStore(vaultDir);
  return store[key];
}

export function listByPriority(
  vaultDir: string,
  level: PriorityLevel
): string[] {
  const store = loadPriorityStore(vaultDir);
  return Object.entries(store)
    .filter(([, v]) => v === level)
    .map(([k]) => k);
}
