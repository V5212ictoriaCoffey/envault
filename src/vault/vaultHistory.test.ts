import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  getHistoryPath,
  loadHistoryStore,
  appendHistoryEntry,
  getKeyHistory,
  clearHistory,
  formatHistory,
} from "./vaultHistory";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-history-"));
}

describe("vaultHistory", () => {
  it("getHistoryPath returns correct path", () => {
    expect(getHistoryPath("/vault")).toBe("/vault/.envault-history.json");
  });

  it("loadHistoryStore returns empty store if file missing", () => {
    const dir = makeTempDir();
    const store = loadHistoryStore(dir);
    expect(store.entries).toEqual([]);
  });

  it("appendHistoryEntry adds an entry", () => {
    const dir = makeTempDir();
    appendHistoryEntry(dir, "API_KEY", "set", "alice");
    const store = loadHistoryStore(dir);
    expect(store.entries).toHaveLength(1);
    expect(store.entries[0].key).toBe("API_KEY");
    expect(store.entries[0].action).toBe("set");
    expect(store.entries[0].actor).toBe("alice");
  });

  it("appendHistoryEntry works without actor", () => {
    const dir = makeTempDir();
    appendHistoryEntry(dir, "DB_URL", "delete");
    const store = loadHistoryStore(dir);
    expect(store.entries[0].actor).toBeUndefined();
  });

  it("getKeyHistory filters by key", () => {
    const dir = makeTempDir();
    appendHistoryEntry(dir, "API_KEY", "set");
    appendHistoryEntry(dir, "DB_URL", "set");
    appendHistoryEntry(dir, "API_KEY", "rotate");
    const history = getKeyHistory(dir, "API_KEY");
    expect(history).toHaveLength(2);
    expect(history.every((e) => e.key === "API_KEY")).toBe(true);
  });

  it("clearHistory empties entries", () => {
    const dir = makeTempDir();
    appendHistoryEntry(dir, "API_KEY", "set");
    clearHistory(dir);
    const store = loadHistoryStore(dir);
    expect(store.entries).toHaveLength(0);
  });

  it("formatHistory returns no history message when empty", () => {
    expect(formatHistory([])).toBe("No history found.");
  });

  it("formatHistory formats entries correctly", () => {
    const entries = [
      { key: "API_KEY", action: "set" as const, timestamp: "2024-01-01T00:00:00.000Z", actor: "bob" },
    ];
    const result = formatHistory(entries);
    expect(result).toContain("SET");
    expect(result).toContain("API_KEY");
    expect(result).toContain("bob");
  });
});
