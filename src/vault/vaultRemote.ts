import fs from "fs";
import path from "path";

export interface RemoteConfig {
  url: string;
  provider: "s3" | "gcs" | "http" | "custom";
  headers?: Record<string, string>;
  lastSynced?: string;
}

export interface RemoteStore {
  remotes: Record<string, RemoteConfig>;
}

export function getRemotePath(vaultDir: string): string {
  return path.join(vaultDir, ".envault-remotes.json");
}

export function loadRemoteStore(vaultDir: string): RemoteStore {
  const p = getRemotePath(vaultDir);
  if (!fs.existsSync(p)) return { remotes: {} };
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return { remotes: {} };
  }
}

export function saveRemoteStore(vaultDir: string, store: RemoteStore): void {
  fs.writeFileSync(getRemotePath(vaultDir), JSON.stringify(store, null, 2));
}

export function addRemote(
  vaultDir: string,
  name: string,
  config: RemoteConfig
): RemoteStore {
  const store = loadRemoteStore(vaultDir);
  store.remotes[name] = config;
  saveRemoteStore(vaultDir, store);
  return store;
}

export function removeRemote(vaultDir: string, name: string): RemoteStore {
  const store = loadRemoteStore(vaultDir);
  delete store.remotes[name];
  saveRemoteStore(vaultDir, store);
  return store;
}

export function getRemote(
  vaultDir: string,
  name: string
): RemoteConfig | undefined {
  return loadRemoteStore(vaultDir).remotes[name];
}

export function listRemotes(vaultDir: string): Array<{ name: string } & RemoteConfig> {
  const store = loadRemoteStore(vaultDir);
  return Object.entries(store.remotes).map(([name, cfg]) => ({ name, ...cfg }));
}

export function updateLastSynced(vaultDir: string, name: string): RemoteStore {
  const store = loadRemoteStore(vaultDir);
  if (store.remotes[name]) {
    store.remotes[name].lastSynced = new Date().toISOString();
    saveRemoteStore(vaultDir, store);
  }
  return store;
}
