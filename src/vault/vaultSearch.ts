import { Vault } from "./vault";
import { decryptEnvRecord } from "../crypto";

export interface SearchResult {
  key: string;
  preview: string;
}

export interface SearchOptions {
  decryptedValues?: boolean;
  privateKeyPath?: string;
  caseSensitive?: boolean;
}

/**
 * Search vault keys by a query string (substring match).
 */
export function searchVaultKeys(
  vault: Vault,
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  const { caseSensitive = false } = options;
  const normalizedQuery = caseSensitive ? query : query.toLowerCase();

  return Object.keys(vault.entries)
    .filter((key) => {
      const normalizedKey = caseSensitive ? key : key.toLowerCase();
      return normalizedKey.includes(normalizedQuery);
    })
    .map((key) => ({
      key,
      preview: maskPreview(vault.entries[key].encryptedValue),
    }));
}

/**
 * Search vault keys and optionally decrypt values for matching entries.
 */
export async function searchVaultDecrypted(
  vault: Vault,
  query: string,
  privateKey: string,
  caseSensitive = false
): Promise<Array<{ key: string; value: string }>> {
  const normalizedQuery = caseSensitive ? query : query.toLowerCase();

  const matchingKeys = Object.keys(vault.entries).filter((key) => {
    const normalizedKey = caseSensitive ? key : key.toLowerCase();
    return normalizedKey.includes(normalizedQuery);
  });

  const results: Array<{ key: string; value: string }> = [];

  for (const key of matchingKeys) {
    try {
      const value = decryptEnvRecord(vault.entries[key], privateKey);
      results.push({ key, value });
    } catch {
      results.push({ key, value: "<decryption failed>" });
    }
  }

  return results;
}

function maskPreview(encryptedValue: string): string {
  const preview = encryptedValue.slice(0, 12);
  return `${preview}...`;
}
