import * as fs from "fs";
import * as path from "path";
import { parseEnv } from "../env/parser";
import { encryptEnvRecord } from "../crypto/encrypt";
import { loadVault, saveVault } from "./vault";
import type { Vault } from "./vault";

export function resolveEnvFilePath(filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

export function readEnvFile(filePath: string): Record<string, string> {
  const resolved = resolveEnvFilePath(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found: ${resolved}`);
  }
  const content = fs.readFileSync(resolved, "utf-8");
  return parseEnv(content);
}

export async function importEnvToVault(
  envFilePath: string,
  vaultPath: string,
  publicKeyPath: string,
  options: { overwrite?: boolean } = {}
): Promise<{ imported: string[]; skipped: string[] }> {
  const { overwrite = false } = options;

  const envRecord = readEnvFile(envFilePath);
  const vault = loadVault(vaultPath);
  const publicKey = fs.readFileSync(publicKeyPath, "utf-8");

  const imported: string[] = [];
  const skipped: string[] = [];

  for (const [key, value] of Object.entries(envRecord)) {
    if (vault.secrets[key] && !overwrite) {
      skipped.push(key);
      continue;
    }
    vault.secrets[key] = encryptEnvRecord(key, value, publicKey);
    imported.push(key);
  }

  if (imported.length > 0) {
    vault.updatedAt = new Date().toISOString();
    saveVault(vaultPath, vault);
  }

  return { imported, skipped };
}
