import * as fs from "fs";
import * as path from "path";

export interface VaultTag {
  name: string;
  keys: string[];
  createdAt: string;
}

export interface TagStore {
  tags: Record<string, VaultTag>;
}

export function getTagPath(vaultDir: string): string {
  return path.join(vaultDir, ".vault-tags.json");
}

export function loadTagStore(vaultDir: string): TagStore {
  const tagPath = getTagPath(vaultDir);
  if (!fs.existsSync(tagPath)) {
    return { tags: {} };
  }
  const raw = fs.readFileSync(tagPath, "utf-8");
  return JSON.parse(raw) as TagStore;
}

export function saveTagStore(vaultDir: string, store: TagStore): void {
  const tagPath = getTagPath(vaultDir);
  fs.writeFileSync(tagPath, JSON.stringify(store, null, 2), "utf-8");
}

export function addTag(vaultDir: string, tagName: string, keys: string[]): VaultTag {
  const store = loadTagStore(vaultDir);
  const tag: VaultTag = {
    name: tagName,
    keys,
    createdAt: new Date().toISOString(),
  };
  store.tags[tagName] = tag;
  saveTagStore(vaultDir, store);
  return tag;
}

export function removeTag(vaultDir: string, tagName: string): boolean {
  const store = loadTagStore(vaultDir);
  if (!store.tags[tagName]) return false;
  delete store.tags[tagName];
  saveTagStore(vaultDir, store);
  return true;
}

export function getTag(vaultDir: string, tagName: string): VaultTag | undefined {
  const store = loadTagStore(vaultDir);
  return store.tags[tagName];
}

export function listTags(vaultDir: string): VaultTag[] {
  const store = loadTagStore(vaultDir);
  return Object.values(store.tags);
}

export function getKeysForTag(vaultDir: string, tagName: string): string[] {
  const tag = getTag(vaultDir, tagName);
  return tag ? tag.keys : [];
}
