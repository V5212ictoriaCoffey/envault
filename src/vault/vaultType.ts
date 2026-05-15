import * as fs from "fs";
import * as path from "path";

export type EnvValueType = "string" | "number" | "boolean" | "url" | "email" | "json";

export interface TypeStore {
  [key: string]: EnvValueType;
}

export function getTypePath(vaultDir: string): string {
  return path.join(vaultDir, ".envault-types.json");
}

export function loadTypeStore(vaultDir: string): TypeStore {
  const filePath = getTypePath(vaultDir);
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as TypeStore;
}

export function saveTypeStore(vaultDir: string, store: TypeStore): void {
  const filePath = getTypePath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function setType(vaultDir: string, key: string, type: EnvValueType): TypeStore {
  const store = loadTypeStore(vaultDir);
  store[key] = type;
  saveTypeStore(vaultDir, store);
  return store;
}

export function removeType(vaultDir: string, key: string): TypeStore {
  const store = loadTypeStore(vaultDir);
  delete store[key];
  saveTypeStore(vaultDir, store);
  return store;
}

export function getType(vaultDir: string, key: string): EnvValueType | undefined {
  const store = loadTypeStore(vaultDir);
  return store[key];
}

export function validateValueType(value: string, type: EnvValueType): boolean {
  switch (type) {
    case "number":
      return !isNaN(Number(value)) && value.trim() !== "";
    case "boolean":
      return ["true", "false", "1", "0"].includes(value.toLowerCase());
    case "url":
      try { new URL(value); return true; } catch { return false; }
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case "json":
      try { JSON.parse(value); return true; } catch { return false; }
    case "string":
    default:
      return true;
  }
}

export function listTypedKeys(vaultDir: string): Array<{ key: string; type: EnvValueType }> {
  const store = loadTypeStore(vaultDir);
  return Object.entries(store).map(([key, type]) => ({ key, type }));
}
