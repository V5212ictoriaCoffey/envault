import { Vault } from './vault';

export interface VaultStats {
  totalKeys: number;
  createdAt: string | null;
  updatedAt: string | null;
  version: string;
  keyNames: string[];
}

/**
 * Returns metadata/statistics about a vault without decrypting its contents.
 */
export function getVaultStats(vault: Vault): VaultStats {
  const keyNames = Object.keys(vault.data);
  return {
    totalKeys: keyNames.length,
    createdAt: vault.createdAt ?? null,
    updatedAt: vault.updatedAt ?? null,
    version: vault.version ?? '1',
    keyNames,
  };
}

/**
 * Returns a human-readable summary string for a vault.
 */
export function formatVaultSummary(stats: VaultStats): string {
  const lines: string[] = [
    `Version:      ${stats.version}`,
    `Total keys:   ${stats.totalKeys}`,
    `Key names:    ${stats.keyNames.length > 0 ? stats.keyNames.join(', ') : '(none)'}`,
    `Created at:   ${stats.createdAt ? new Date(stats.createdAt).toLocaleString() : 'unknown'}`,
    `Updated at:   ${stats.updatedAt ? new Date(stats.updatedAt).toLocaleString() : 'unknown'}`,
  ];
  return lines.join('\n');
}
