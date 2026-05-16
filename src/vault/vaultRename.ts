import * as fs from 'fs';
import * as path from 'path';

export interface RenameStore {
  [oldKey: string]: string;
}

export function getRenamePath(vaultDir: string): string {
  return path.join(vaultDir, '.envault-renames.json');
}

export function loadRenameStore(vaultDir: string): RenameStore {
  const p = getRenamePath(vaultDir);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export function saveRenameStore(vaultDir: string, store: RenameStore): void {
  fs.writeFileSync(getRenamePath(vaultDir), JSON.stringify(store, null, 2));
}

export function recordRename(vaultDir: string, oldKey: string, newKey: string): void {
  const store = loadRenameStore(vaultDir);
  store[oldKey] = newKey;
  saveRenameStore(vaultDir, store);
}

export function removeRenameRecord(vaultDir: string, oldKey: string): void {
  const store = loadRenameStore(vaultDir);
  delete store[oldKey];
  saveRenameStore(vaultDir, store);
}

export function resolveRename(vaultDir: string, key: string): string | undefined {
  const store = loadRenameStore(vaultDir);
  return store[key];
}

export function listRenames(vaultDir: string): Array<{ from: string; to: string }> {
  const store = loadRenameStore(vaultDir);
  return Object.entries(store).map(([from, to]) => ({ from, to }));
}

export function renameKeyInVault(
  vault: Record<string, string>,
  oldKey: string,
  newKey: string
): Record<string, string> {
  if (!(oldKey in vault)) {
    throw new Error(`Key "${oldKey}" not found in vault`);
  }
  if (newKey in vault) {
    throw new Error(`Key "${newKey}" already exists in vault`);
  }
  const updated: Record<string, string> = {};
  for (const [k, v] of Object.entries(vault)) {
    updated[k === oldKey ? newKey : k] = v;
  }
  return updated;
}
