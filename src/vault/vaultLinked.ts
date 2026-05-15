import * as fs from 'fs';
import * as path from 'path';

export interface LinkedKeyEntry {
  sourceKey: string;
  targetKey: string;
  description?: string;
  createdAt: string;
}

export interface LinkedKeyStore {
  links: LinkedKeyEntry[];
}

export function getLinkedPath(vaultDir: string): string {
  return path.join(vaultDir, '.envault', 'linked.json');
}

export function loadLinkedStore(vaultDir: string): LinkedKeyStore {
  const filePath = getLinkedPath(vaultDir);
  if (!fs.existsSync(filePath)) return { links: [] };
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as LinkedKeyStore;
}

export function saveLinkedStore(vaultDir: string, store: LinkedKeyStore): void {
  const filePath = getLinkedPath(vaultDir);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function linkKeys(
  vaultDir: string,
  sourceKey: string,
  targetKey: string,
  description?: string
): void {
  const store = loadLinkedStore(vaultDir);
  const exists = store.links.find(
    (l) => l.sourceKey === sourceKey && l.targetKey === targetKey
  );
  if (exists) return;
  store.links.push({
    sourceKey,
    targetKey,
    description,
    createdAt: new Date().toISOString(),
  });
  saveLinkedStore(vaultDir, store);
}

export function unlinkKeys(
  vaultDir: string,
  sourceKey: string,
  targetKey: string
): void {
  const store = loadLinkedStore(vaultDir);
  store.links = store.links.filter(
    (l) => !(l.sourceKey === sourceKey && l.targetKey === targetKey)
  );
  saveLinkedStore(vaultDir, store);
}

export function getLinksForKey(
  vaultDir: string,
  key: string
): LinkedKeyEntry[] {
  const store = loadLinkedStore(vaultDir);
  return store.links.filter(
    (l) => l.sourceKey === key || l.targetKey === key
  );
}

export function getAllLinks(vaultDir: string): LinkedKeyEntry[] {
  return loadLinkedStore(vaultDir).links;
}
