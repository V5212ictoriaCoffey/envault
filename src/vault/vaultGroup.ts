import fs from "fs";
import path from "path";

export interface GroupStore {
  groups: Record<string, string[]>; // groupName -> list of vault keys
}

export function getGroupPath(vaultDir: string): string {
  return path.join(vaultDir, ".vault-groups.json");
}

export function loadGroupStore(vaultDir: string): GroupStore {
  const p = getGroupPath(vaultDir);
  if (!fs.existsSync(p)) return { groups: {} };
  return JSON.parse(fs.readFileSync(p, "utf-8")) as GroupStore;
}

export function saveGroupStore(vaultDir: string, store: GroupStore): void {
  fs.writeFileSync(getGroupPath(vaultDir), JSON.stringify(store, null, 2));
}

export function createGroup(vaultDir: string, groupName: string): GroupStore {
  const store = loadGroupStore(vaultDir);
  if (store.groups[groupName]) throw new Error(`Group "${groupName}" already exists.`);
  store.groups[groupName] = [];
  saveGroupStore(vaultDir, store);
  return store;
}

export function deleteGroup(vaultDir: string, groupName: string): GroupStore {
  const store = loadGroupStore(vaultDir);
  if (!store.groups[groupName]) throw new Error(`Group "${groupName}" not found.`);
  delete store.groups[groupName];
  saveGroupStore(vaultDir, store);
  return store;
}

export function addKeyToGroup(vaultDir: string, groupName: string, key: string): GroupStore {
  const store = loadGroupStore(vaultDir);
  if (!store.groups[groupName]) throw new Error(`Group "${groupName}" not found.`);
  if (!store.groups[groupName].includes(key)) {
    store.groups[groupName].push(key);
    saveGroupStore(vaultDir, store);
  }
  return store;
}

export function removeKeyFromGroup(vaultDir: string, groupName: string, key: string): GroupStore {
  const store = loadGroupStore(vaultDir);
  if (!store.groups[groupName]) throw new Error(`Group "${groupName}" not found.`);
  store.groups[groupName] = store.groups[groupName].filter((k) => k !== key);
  saveGroupStore(vaultDir, store);
  return store;
}

export function listGroups(vaultDir: string): string[] {
  return Object.keys(loadGroupStore(vaultDir).groups);
}

export function getGroupKeys(vaultDir: string, groupName: string): string[] {
  const store = loadGroupStore(vaultDir);
  if (!store.groups[groupName]) throw new Error(`Group "${groupName}" not found.`);
  return store.groups[groupName];
}
