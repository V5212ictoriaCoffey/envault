import * as fs from "fs";
import * as path from "path";
import { Vault } from "./vault";

export interface BackupMeta {
  createdAt: string;
  vaultFile: string;
  backupFile: string;
}

export function getBackupPath(vaultPath: string, timestamp?: Date): string {
  const dir = path.dirname(vaultPath);
  const base = path.basename(vaultPath, ".vault.json");
  const ts = (timestamp ?? new Date()).toISOString().replace(/[:.]/g, "-");
  return path.join(dir, `${base}.vault.${ts}.bak.json`);
}

export function backupVault(vaultPath: string, timestamp?: Date): BackupMeta {
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault file not found: ${vaultPath}`);
  }

  const backupFile = getBackupPath(vaultPath, timestamp);
  fs.copyFileSync(vaultPath, backupFile);

  return {
    createdAt: (timestamp ?? new Date()).toISOString(),
    vaultFile: vaultPath,
    backupFile,
  };
}

export function listBackups(vaultPath: string): string[] {
  const dir = path.dirname(vaultPath);
  const base = path.basename(vaultPath, ".vault.json");
  const prefix = `${base}.vault.`;
  const suffix = ".bak.json";

  return fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(prefix) && f.endsWith(suffix))
    .map((f) => path.join(dir, f))
    .sort();
}

export function pruneBackups(vaultPath: string, keepCount: number): string[] {
  const backups = listBackups(vaultPath);
  const toDelete = backups.slice(0, Math.max(0, backups.length - keepCount));
  toDelete.forEach((f) => fs.unlinkSync(f));
  return toDelete;
}

export function restoreBackup(backupPath: string, vaultPath: string): void {
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }
  fs.copyFileSync(backupPath, vaultPath);
}
