import * as fs from "fs";
import * as path from "path";

export interface RequireStore {
  required: string[];
}

export function getRequirePath(vaultDir: string): string {
  return path.join(vaultDir, ".envault-required.json");
}

export function loadRequireStore(vaultDir: string): RequireStore {
  const p = getRequirePath(vaultDir);
  if (!fs.existsSync(p)) return { required: [] };
  return JSON.parse(fs.readFileSync(p, "utf-8")) as RequireStore;
}

export function saveRequireStore(vaultDir: string, store: RequireStore): void {
  fs.writeFileSync(getRequirePath(vaultDir), JSON.stringify(store, null, 2));
}

export function requireKey(vaultDir: string, key: string): void {
  const store = loadRequireStore(vaultDir);
  if (!store.required.includes(key)) {
    store.required.push(key);
    saveRequireStore(vaultDir, store);
  }
}

export function unrequireKey(vaultDir: string, key: string): void {
  const store = loadRequireStore(vaultDir);
  store.required = store.required.filter((k) => k !== key);
  saveRequireStore(vaultDir, store);
}

export function isKeyRequired(vaultDir: string, key: string): boolean {
  return loadRequireStore(vaultDir).required.includes(key);
}

export function listRequiredKeys(vaultDir: string): string[] {
  return loadRequireStore(vaultDir).required;
}

export function validateRequiredKeys(
  vaultDir: string,
  presentKeys: string[]
): string[] {
  const required = listRequiredKeys(vaultDir);
  return required.filter((k) => !presentKeys.includes(k));
}
