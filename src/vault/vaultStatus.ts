import * as fs from "fs";
import * as path from "path";

export type KeyStatus = "active" | "deprecated" | "expired" | "locked" | "required";

export interface StatusEntry {
  key: string;
  status: KeyStatus;
  reason?: string;
  updatedAt: string;
}

export type StatusStore = Record<string, StatusEntry>;

export function getStatusPath(vaultDir: string): string {
  return path.join(vaultDir, ".envault-status.json");
}

export function loadStatusStore(vaultDir: string): StatusStore {
  const filePath = getStatusPath(vaultDir);
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as StatusStore;
}

export function saveStatusStore(vaultDir: string, store: StatusStore): void {
  const filePath = getStatusPath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function setStatus(
  vaultDir: string,
  key: string,
  status: KeyStatus,
  reason?: string
): StatusEntry {
  const store = loadStatusStore(vaultDir);
  const entry: StatusEntry = {
    key,
    status,
    reason,
    updatedAt: new Date().toISOString(),
  };
  store[key] = entry;
  saveStatusStore(vaultDir, store);
  return entry;
}

export function removeStatus(vaultDir: string, key: string): boolean {
  const store = loadStatusStore(vaultDir);
  if (!store[key]) return false;
  delete store[key];
  saveStatusStore(vaultDir, store);
  return true;
}

export function getStatus(vaultDir: string, key: string): StatusEntry | undefined {
  const store = loadStatusStore(vaultDir);
  return store[key];
}

export function listStatuses(vaultDir: string): StatusEntry[] {
  const store = loadStatusStore(vaultDir);
  return Object.values(store);
}

export function formatStatusList(entries: StatusEntry[]): string {
  if (entries.length === 0) return "No status entries found.";
  return entries
    .map((e) => {
      const reason = e.reason ? ` — ${e.reason}` : "";
      return `  ${e.key.padEnd(30)} [${e.status}]${reason}`;
    })
    .join("\n");
}
