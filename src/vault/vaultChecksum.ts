import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { Vault } from "./vault";

export interface ChecksumStore {
  [key: string]: string;
}

export function getChecksumPath(vaultDir: string): string {
  return path.join(vaultDir, ".envault-checksums.json");
}

export function loadChecksumStore(vaultDir: string): ChecksumStore {
  const filePath = getChecksumPath(vaultDir);
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as ChecksumStore;
}

export function saveChecksumStore(vaultDir: string, store: ChecksumStore): void {
  const filePath = getChecksumPath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function computeChecksum(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function setChecksum(vaultDir: string, key: string, value: string): void {
  const store = loadChecksumStore(vaultDir);
  store[key] = computeChecksum(value);
  saveChecksumStore(vaultDir, store);
}

export function removeChecksum(vaultDir: string, key: string): void {
  const store = loadChecksumStore(vaultDir);
  delete store[key];
  saveChecksumStore(vaultDir, store);
}

export function verifyChecksum(vaultDir: string, key: string, value: string): boolean {
  const store = loadChecksumStore(vaultDir);
  if (!(key in store)) return false;
  return store[key] === computeChecksum(value);
}

export function detectTamperedKeys(vault: Vault, vaultDir: string): string[] {
  const store = loadChecksumStore(vaultDir);
  const tampered: string[] = [];
  for (const [key, encryptedValue] of Object.entries(vault.secrets)) {
    if (key in store && store[key] !== computeChecksum(encryptedValue)) {
      tampered.push(key);
    }
  }
  return tampered;
}
