import * as fs from "fs";
import * as path from "path";

export interface DeprecateStore {
  [key: string]: {
    reason?: string;
    deprecatedAt: string;
    replacedBy?: string;
  };
}

export function getDeprecatePath(vaultDir: string): string {
  return path.join(vaultDir, ".deprecations.json");
}

export function loadDeprecateStore(vaultDir: string): DeprecateStore {
  const filePath = getDeprecatePath(vaultDir);
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as DeprecateStore;
}

export function saveDeprecateStore(vaultDir: string, store: DeprecateStore): void {
  const filePath = getDeprecatePath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function deprecateKey(
  vaultDir: string,
  key: string,
  reason?: string,
  replacedBy?: string
): DeprecateStore {
  const store = loadDeprecateStore(vaultDir);
  store[key] = {
    deprecatedAt: new Date().toISOString(),
    ...(reason ? { reason } : {}),
    ...(replacedBy ? { replacedBy } : {}),
  };
  saveDeprecateStore(vaultDir, store);
  return store;
}

export function undeprecateKey(vaultDir: string, key: string): DeprecateStore {
  const store = loadDeprecateStore(vaultDir);
  delete store[key];
  saveDeprecateStore(vaultDir, store);
  return store;
}

export function isDeprecated(vaultDir: string, key: string): boolean {
  const store = loadDeprecateStore(vaultDir);
  return key in store;
}

export function listDeprecated(vaultDir: string): string[] {
  return Object.keys(loadDeprecateStore(vaultDir));
}

export function formatDeprecations(store: DeprecateStore): string {
  const keys = Object.keys(store);
  if (keys.length === 0) return "No deprecated keys.";
  return keys
    .map((k) => {
      const entry = store[k];
      const parts = [`  ${k}  (deprecated ${entry.deprecatedAt})`];
      if (entry.reason) parts.push(`    reason: ${entry.reason}`);
      if (entry.replacedBy) parts.push(`    replaced by: ${entry.replacedBy}`);
      return parts.join("\n");
    })
    .join("\n");
}
