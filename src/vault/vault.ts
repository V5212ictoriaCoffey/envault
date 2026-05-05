import * as fs from 'fs';
import * as path from 'path';
import { encryptEnvRecord, decryptEnvRecord } from '../crypto/encrypt';
import { parseEnv, stringifyEnv } from '../env/parser';

export interface VaultFile {
  version: number;
  createdAt: string;
  updatedAt: string;
  entries: Record<string, string>;
}

const VAULT_VERSION = 1;

export function createVault(envPath: string, publicKeyPath: string): VaultFile {
  const rawEnv = fs.readFileSync(envPath, 'utf-8');
  const publicKey = fs.readFileSync(publicKeyPath, 'utf-8');
  const parsed = parseEnv(rawEnv);

  const encrypted: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    encrypted[key] = encryptEnvRecord(key, value, publicKey);
  }

  const now = new Date().toISOString();
  return {
    version: VAULT_VERSION,
    createdAt: now,
    updatedAt: now,
    entries: encrypted,
  };
}

export function saveVault(vault: VaultFile, vaultPath: string): void {
  const dir = path.dirname(vaultPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(vaultPath, JSON.stringify(vault, null, 2), 'utf-8');
}

export function loadVault(vaultPath: string): VaultFile {
  const raw = fs.readFileSync(vaultPath, 'utf-8');
  const vault = JSON.parse(raw) as VaultFile;
  if (vault.version !== VAULT_VERSION) {
    throw new Error(`Unsupported vault version: ${vault.version}`);
  }
  return vault;
}

export function decryptVault(
  vault: VaultFile,
  privateKeyPath: string
): Record<string, string> {
  const privateKey = fs.readFileSync(privateKeyPath, 'utf-8');
  const decrypted: Record<string, string> = {};
  for (const [key, encryptedValue] of Object.entries(vault.entries)) {
    decrypted[key] = decryptEnvRecord(key, encryptedValue, privateKey);
  }
  return decrypted;
}

export function exportVaultToEnv(
  vault: VaultFile,
  privateKeyPath: string,
  outputPath: string
): void {
  const decrypted = decryptVault(vault, privateKeyPath);
  const envContent = stringifyEnv(decrypted);
  fs.writeFileSync(outputPath, envContent, 'utf-8');
}
