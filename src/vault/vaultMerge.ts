import { VaultFile } from './vault';

export interface MergeResult {
  merged: VaultFile;
  conflicts: string[];
  added: string[];
  removed: string[];
}

/**
 * Merges two vault files, preferring entries from `incoming` on conflict.
 * Returns a MergeResult describing what changed.
 */
export function mergeVaults(base: VaultFile, incoming: VaultFile): MergeResult {
  const conflicts: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];

  const mergedEntries: Record<string, string> = { ...base.entries };

  for (const key of Object.keys(incoming.entries)) {
    if (!(key in base.entries)) {
      added.push(key);
    } else if (base.entries[key] !== incoming.entries[key]) {
      conflicts.push(key);
    }
    mergedEntries[key] = incoming.entries[key];
  }

  for (const key of Object.keys(base.entries)) {
    if (!(key in incoming.entries)) {
      removed.push(key);
      delete mergedEntries[key];
    }
  }

  const merged: VaultFile = {
    version: base.version,
    createdAt: base.createdAt,
    updatedAt: new Date().toISOString(),
    entries: mergedEntries,
  };

  return { merged, conflicts, added, removed };
}

/**
 * Returns keys present in `vault` but missing from `referenceKeys`.
 */
export function diffVaultKeys(
  vault: VaultFile,
  referenceKeys: string[]
): { missing: string[]; extra: string[] } {
  const vaultKeys = Object.keys(vault.entries);
  const missing = referenceKeys.filter((k) => !vaultKeys.includes(k));
  const extra = vaultKeys.filter((k) => !referenceKeys.includes(k));
  return { missing, extra };
}
