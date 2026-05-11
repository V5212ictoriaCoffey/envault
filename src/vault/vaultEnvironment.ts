import * as fs from "fs";
import * as path from "path";

export interface EnvironmentStore {
  environments: Record<string, string[]>; // env name -> list of vault keys
}

export function getEnvironmentPath(vaultDir: string): string {
  return path.join(vaultDir, ".envault-environments.json");
}

export function loadEnvironmentStore(vaultDir: string): EnvironmentStore {
  const filePath = getEnvironmentPath(vaultDir);
  if (!fs.existsSync(filePath)) {
    return { environments: {} };
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as EnvironmentStore;
}

export function saveEnvironmentStore(vaultDir: string, store: EnvironmentStore): void {
  const filePath = getEnvironmentPath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function addKeyToEnvironment(vaultDir: string, env: string, key: string): EnvironmentStore {
  const store = loadEnvironmentStore(vaultDir);
  if (!store.environments[env]) {
    store.environments[env] = [];
  }
  if (!store.environments[env].includes(key)) {
    store.environments[env].push(key);
  }
  saveEnvironmentStore(vaultDir, store);
  return store;
}

export function removeKeyFromEnvironment(vaultDir: string, env: string, key: string): EnvironmentStore {
  const store = loadEnvironmentStore(vaultDir);
  if (!store.environments[env]) return store;
  store.environments[env] = store.environments[env].filter((k) => k !== key);
  if (store.environments[env].length === 0) {
    delete store.environments[env];
  }
  saveEnvironmentStore(vaultDir, store);
  return store;
}

export function deleteEnvironment(vaultDir: string, env: string): EnvironmentStore {
  const store = loadEnvironmentStore(vaultDir);
  delete store.environments[env];
  saveEnvironmentStore(vaultDir, store);
  return store;
}

export function listEnvironments(vaultDir: string): string[] {
  const store = loadEnvironmentStore(vaultDir);
  return Object.keys(store.environments);
}

export function getKeysForEnvironment(vaultDir: string, env: string): string[] {
  const store = loadEnvironmentStore(vaultDir);
  return store.environments[env] ?? [];
}
