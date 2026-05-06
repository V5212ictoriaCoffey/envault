import * as fs from "fs";
import * as path from "path";
import { Vault, createVault } from "./vault";
import { parseEnv } from "../env/parser";
import { encryptEnvRecord } from "../crypto/encrypt";

export interface ImportResult {
  imported: string[];
  skipped: string[];
  total: number;
}

/**
 * Import key/value pairs from a .env file into a vault.
 * Existing keys are skipped unless `overwrite` is true.
 */
export async function importEnvToVault(
  envFilePath: string,
  publicKeyPath: string,
  existingVault: Vault | null,
  options: { overwrite?: boolean } = {}
): Promise<{ vault: Vault; result: ImportResult }> {
  const raw = fs.readFileSync(envFilePath, "utf-8");
  const parsed = parseEnv(raw);

  const base: Vault = existingVault ?? createVault(publicKeyPath);
  const imported: string[] = [];
  const skipped: string[] = [];

  for (const [key, value] of Object.entries(parsed)) {
    const alreadyExists = key in base.entries;
    if (alreadyExists && !options.overwrite) {
      skipped.push(key);
      continue;
    }
    const encrypted = await encryptEnvRecord(key, value, publicKeyPath);
    base.entries[key] = encrypted;
    imported.push(key);
  }

  return {
    vault: base,
    result: {
      imported,
      skipped,
      total: Object.keys(parsed).length,
    },
  };
}

/**
 * Resolve the absolute path to an env file, defaulting to `.env` in cwd.
 */
export function resolveEnvFilePath(filePath?: string): string {
  return filePath
    ? path.resolve(filePath)
    : path.join(process.cwd(), ".env");
}
