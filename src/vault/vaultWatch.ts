import * as fs from "fs";
import * as path from "path";

export type WatchEvent = "added" | "removed" | "changed";

export interface WatchEntry {
  key: string;
  event: WatchEvent;
  timestamp: string;
}

export type WatchCallback = (entries: WatchEntry[]) => void;

export function getWatchablePath(vaultDir: string): string {
  return path.join(vaultDir, "vault.json");
}

export function diffVaultKeys(
  previous: Record<string, string>,
  current: Record<string, string>
): WatchEntry[] {
  const entries: WatchEntry[] = [];
  const timestamp = new Date().toISOString();

  for (const key of Object.keys(current)) {
    if (!(key in previous)) {
      entries.push({ key, event: "added", timestamp });
    } else if (previous[key] !== current[key]) {
      entries.push({ key, event: "changed", timestamp });
    }
  }

  for (const key of Object.keys(previous)) {
    if (!(key in current)) {
      entries.push({ key, event: "removed", timestamp });
    }
  }

  return entries;
}

export function watchVault(
  vaultPath: string,
  readVaultKeys: () => Record<string, string>,
  callback: WatchCallback
): fs.FSWatcher {
  let previousKeys = readVaultKeys();

  const watcher = fs.watch(vaultPath, { persistent: false }, () => {
    try {
      const currentKeys = readVaultKeys();
      const changes = diffVaultKeys(previousKeys, currentKeys);
      if (changes.length > 0) {
        callback(changes);
      }
      previousKeys = currentKeys;
    } catch {
      // vault may be mid-write; skip this tick
    }
  });

  return watcher;
}

export function formatWatchLog(entries: WatchEntry[]): string {
  return entries
    .map((e) => `[${e.timestamp}] ${e.event.toUpperCase()} ${e.key}`)
    .join("\n");
}
