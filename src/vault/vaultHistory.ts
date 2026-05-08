import * as fs from "fs";
import * as path from "path";

export interface HistoryEntry {
  key: string;
  action: "set" | "delete" | "rotate";
  timestamp: string;
  actor?: string;
}

export interface HistoryStore {
  entries: HistoryEntry[];
}

export function getHistoryPath(vaultDir: string): string {
  return path.join(vaultDir, ".envault-history.json");
}

export function loadHistoryStore(vaultDir: string): HistoryStore {
  const filePath = getHistoryPath(vaultDir);
  if (!fs.existsSync(filePath)) {
    return { entries: [] };
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as HistoryStore;
}

export function saveHistoryStore(vaultDir: string, store: HistoryStore): void {
  const filePath = getHistoryPath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function appendHistoryEntry(
  vaultDir: string,
  key: string,
  action: HistoryEntry["action"],
  actor?: string
): void {
  const store = loadHistoryStore(vaultDir);
  store.entries.push({
    key,
    action,
    timestamp: new Date().toISOString(),
    actor,
  });
  saveHistoryStore(vaultDir, store);
}

export function getKeyHistory(vaultDir: string, key: string): HistoryEntry[] {
  const store = loadHistoryStore(vaultDir);
  return store.entries.filter((e) => e.key === key);
}

export function clearHistory(vaultDir: string): void {
  saveHistoryStore(vaultDir, { entries: [] });
}

export function formatHistory(entries: HistoryEntry[]): string {
  if (entries.length === 0) return "No history found.";
  return entries
    .map((e) => {
      const actor = e.actor ? ` (${e.actor})` : "";
      return `[${e.timestamp}] ${e.action.toUpperCase()} ${e.key}${actor}`;
    })
    .join("\n");
}
