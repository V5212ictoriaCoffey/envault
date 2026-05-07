import * as fs from "fs";
import * as path from "path";

export interface EnvProfile {
  name: string;
  description?: string;
  keys: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EnvProfileStore {
  profiles: Record<string, EnvProfile>;
}

export function getEnvProfileStorePath(vaultDir: string): string {
  return path.join(vaultDir, ".envault-profiles.json");
}

export function loadEnvProfileStore(vaultDir: string): EnvProfileStore {
  const filePath = getEnvProfileStorePath(vaultDir);
  if (!fs.existsSync(filePath)) {
    return { profiles: {} };
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as EnvProfileStore;
}

export function saveEnvProfileStore(vaultDir: string, store: EnvProfileStore): void {
  const filePath = getEnvProfileStorePath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function createEnvProfile(
  vaultDir: string,
  name: string,
  keys: string[],
  description?: string
): EnvProfile {
  const store = loadEnvProfileStore(vaultDir);
  const now = new Date().toISOString();
  const profile: EnvProfile = {
    name,
    description,
    keys,
    createdAt: now,
    updatedAt: now,
  };
  store.profiles[name] = profile;
  saveEnvProfileStore(vaultDir, store);
  return profile;
}

export function deleteEnvProfile(vaultDir: string, name: string): boolean {
  const store = loadEnvProfileStore(vaultDir);
  if (!store.profiles[name]) return false;
  delete store.profiles[name];
  saveEnvProfileStore(vaultDir, store);
  return true;
}

export function getEnvProfile(vaultDir: string, name: string): EnvProfile | undefined {
  const store = loadEnvProfileStore(vaultDir);
  return store.profiles[name];
}

export function listEnvProfiles(vaultDir: string): EnvProfile[] {
  const store = loadEnvProfileStore(vaultDir);
  return Object.values(store.profiles);
}

export function updateEnvProfileKeys(
  vaultDir: string,
  name: string,
  keys: string[]
): EnvProfile | undefined {
  const store = loadEnvProfileStore(vaultDir);
  if (!store.profiles[name]) return undefined;
  store.profiles[name].keys = keys;
  store.profiles[name].updatedAt = new Date().toISOString();
  saveEnvProfileStore(vaultDir, store);
  return store.profiles[name];
}
