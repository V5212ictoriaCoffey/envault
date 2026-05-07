import * as fs from "fs";
import * as path from "path";

export type EnvEnvironment = "development" | "staging" | "production" | string;

export interface EnvProfile {
  name: EnvEnvironment;
  vaultFile: string;
  description?: string;
}

export interface EnvProfileStore {
  profiles: EnvProfile[];
  active?: EnvEnvironment;
}

export function getEnvProfilePath(vaultDir: string): string {
  return path.join(vaultDir, ".envault-profiles.json");
}

export function loadEnvProfileStore(vaultDir: string): EnvProfileStore {
  const filePath = getEnvProfilePath(vaultDir);
  if (!fs.existsSync(filePath)) {
    return { profiles: [] };
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as EnvProfileStore;
}

export function saveEnvProfileStore(vaultDir: string, store: EnvProfileStore): void {
  const filePath = getEnvProfilePath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function addEnvProfile(
  vaultDir: string,
  name: EnvEnvironment,
  vaultFile: string,
  description?: string
): EnvProfileStore {
  const store = loadEnvProfileStore(vaultDir);
  const existing = store.profiles.findIndex((p) => p.name === name);
  const profile: EnvProfile = { name, vaultFile, description };
  if (existing >= 0) {
    store.profiles[existing] = profile;
  } else {
    store.profiles.push(profile);
  }
  saveEnvProfileStore(vaultDir, store);
  return store;
}

export function removeEnvProfile(vaultDir: string, name: EnvEnvironment): EnvProfileStore {
  const store = loadEnvProfileStore(vaultDir);
  store.profiles = store.profiles.filter((p) => p.name !== name);
  if (store.active === name) {
    delete store.active;
  }
  saveEnvProfileStore(vaultDir, store);
  return store;
}

export function setActiveProfile(vaultDir: string, name: EnvEnvironment): EnvProfileStore {
  const store = loadEnvProfileStore(vaultDir);
  const exists = store.profiles.some((p) => p.name === name);
  if (!exists) {
    throw new Error(`Profile "${name}" does not exist.`);
  }
  store.active = name;
  saveEnvProfileStore(vaultDir, store);
  return store;
}

export function getActiveProfile(vaultDir: string): EnvProfile | undefined {
  const store = loadEnvProfileStore(vaultDir);
  if (!store.active) return undefined;
  return store.profiles.find((p) => p.name === store.active);
}
