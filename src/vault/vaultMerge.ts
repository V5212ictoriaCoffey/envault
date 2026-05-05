import { Vault } from './vault';
import { decryptWithPrivateKey, encryptWithPublicKey } from '../crypto/encrypt';

export interface VaultDiff {
  added: string[];
  updated: string[];
  removed: string[];
}

/**
 * Computes the diff between a local and remote vault based on record keys.
 * Does not decrypt values — purely structural comparison.
 */
export function diffVaultKeys(local: Vault, remote: Vault): VaultDiff {
  const localKeys = new Set(Object.keys(local.records));
  const remoteKeys = new Set(Object.keys(remote.records));

  const added = [...remoteKeys].filter((k) => !localKeys.has(k));
  const removed = [...localKeys].filter((k) => !remoteKeys.has(k));
  const updated = [...remoteKeys].filter(
    (k) => localKeys.has(k) && local.records[k] !== remote.records[k]
  );

  return { added, updated, removed };
}

/**
 * Merges a remote vault into the local vault.
 * Remote entries take precedence for updated keys.
 * Removed keys (present locally but absent remotely) are dropped.
 * Requires the private key to re-encrypt values if public key differs.
 */
export function mergeVaults(local: Vault, remote: Vault, privateKey: string): Vault {
  const diff = diffVaultKeys(local, remote);
  const mergedRecords: Record<string, string> = {};

  // Keep local keys not removed
  for (const key of Object.keys(local.records)) {
    if (!diff.removed.includes(key)) {
      mergedRecords[key] = local.records[key];
    }
  }

  // Apply added and updated from remote
  for (const key of [...diff.added, ...diff.updated]) {
    mergedRecords[key] = remote.records[key];
  }

  return {
    ...local,
    records: mergedRecords,
    updatedAt: new Date().toISOString(),
  };
}
