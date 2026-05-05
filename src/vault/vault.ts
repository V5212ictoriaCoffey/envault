import * as fs from 'fs';
import * as path from 'path';
import { encryptEnvRecord, decryptEnvRecord } from '../crypto/encrypt';
import { EnvRecord } from '../env/parser';

export interface Vault {
  version: number;
  createdAt: string;
  updatedAt?: string;
  records: Record<string, string>; // key -> encrypted value
}

export function createVault(envRecord: EnvRecord, publicKey: string): Vault {
  const encryptedRecords = encryptEnvRecord(envRecord, publicKey);
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    records: encryptedRecords,
  };
}

export function saveVault(vault: Vault, filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(vault, null, 2), 'utf-8');
}

export function loadVault(filePath: string): Vault {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const vault = JSON.parse(raw) as Vault;
  if (!vault.version || !vault.records) {
    throw new Error('Invalid vault format');
  }
  return vault;
}

export function decryptVault(vault: Vault, privateKey: string): EnvRecord {
  return decryptEnvRecord(vault.records, privateKey);
}

export function exportVaultToEnv(vault: Vault, privateKey: string): string {
  const decrypted = decryptVault(vault, privateKey);
  return Object.entries(decrypted)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}
