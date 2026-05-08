import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  diffVaultKeys,
  formatWatchLog,
  getWatchablePath,
  WatchEntry,
} from "./vaultWatch";
import * as path from "path";

describe("getWatchablePath", () => {
  it("returns path to vault.json inside vaultDir", () => {
    const result = getWatchablePath("/home/user/.envault");
    expect(result).toBe(path.join("/home/user/.envault", "vault.json"));
  });
});

describe("diffVaultKeys", () => {
  it("detects added keys", () => {
    const prev = { A: "1" };
    const curr = { A: "1", B: "2" };
    const result = diffVaultKeys(prev, curr);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("B");
    expect(result[0].event).toBe("added");
  });

  it("detects removed keys", () => {
    const prev = { A: "1", B: "2" };
    const curr = { A: "1" };
    const result = diffVaultKeys(prev, curr);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("B");
    expect(result[0].event).toBe("removed");
  });

  it("detects changed keys", () => {
    const prev = { A: "old" };
    const curr = { A: "new" };
    const result = diffVaultKeys(prev, curr);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("A");
    expect(result[0].event).toBe("changed");
  });

  it("returns empty array when nothing changed", () => {
    const prev = { A: "1", B: "2" };
    const curr = { A: "1", B: "2" };
    expect(diffVaultKeys(prev, curr)).toHaveLength(0);
  });

  it("includes a timestamp on each entry", () => {
    const result = diffVaultKeys({}, { X: "val" });
    expect(result[0].timestamp).toBeTruthy();
    expect(new Date(result[0].timestamp).toISOString()).toBe(
      result[0].timestamp
    );
  });
});

describe("formatWatchLog", () => {
  it("formats entries into readable lines", () => {
    const entries: WatchEntry[] = [
      { key: "DB_URL", event: "added", timestamp: "2024-01-01T00:00:00.000Z" },
      { key: "API_KEY", event: "removed", timestamp: "2024-01-01T00:00:01.000Z" },
    ];
    const log = formatWatchLog(entries);
    expect(log).toContain("ADDED DB_URL");
    expect(log).toContain("REMOVED API_KEY");
    expect(log).toContain("2024-01-01T00:00:00.000Z");
  });

  it("returns empty string for no entries", () => {
    expect(formatWatchLog([])).toBe("");
  });
});
