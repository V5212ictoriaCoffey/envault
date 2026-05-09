import fs from "fs";
import path from "path";

export interface DependencyStore {
  [key: string]: string[];
}

export function getDependencyPath(vaultDir: string): string {
  return path.join(vaultDir, ".envault-dependencies.json");
}

export function loadDependencyStore(vaultDir: string): DependencyStore {
  const filePath = getDependencyPath(vaultDir);
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return {};
  }
}

export function saveDependencyStore(vaultDir: string, store: DependencyStore): void {
  const filePath = getDependencyPath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function addDependency(vaultDir: string, key: string, dependsOn: string): void {
  const store = loadDependencyStore(vaultDir);
  if (!store[key]) store[key] = [];
  if (!store[key].includes(dependsOn)) {
    store[key].push(dependsOn);
  }
  saveDependencyStore(vaultDir, store);
}

export function removeDependency(vaultDir: string, key: string, dependsOn: string): void {
  const store = loadDependencyStore(vaultDir);
  if (!store[key]) return;
  store[key] = store[key].filter((d) => d !== dependsOn);
  if (store[key].length === 0) delete store[key];
  saveDependencyStore(vaultDir, store);
}

export function getDependencies(vaultDir: string, key: string): string[] {
  const store = loadDependencyStore(vaultDir);
  return store[key] ?? [];
}

export function getDependents(vaultDir: string, key: string): string[] {
  const store = loadDependencyStore(vaultDir);
  return Object.entries(store)
    .filter(([, deps]) => deps.includes(key))
    .map(([k]) => k);
}

export function clearDependencies(vaultDir: string, key: string): void {
  const store = loadDependencyStore(vaultDir);
  delete store[key];
  saveDependencyStore(vaultDir, store);
}
