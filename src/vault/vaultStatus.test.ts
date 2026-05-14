import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  getStatusPath,
  loadStatusStore,
  saveStatusStore,
  setStatus,
  removeStatus,
  getStatus,
  listStatuses,
  formatStatusList,
} from "./vaultStatus";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-status-"));
}

describe("vaultStatus", () => {
  it("getStatusPath returns correct path", () => {
    const dir = makeTempDir();
    expect(getStatusPath(dir)).toBe(path.join(dir, ".envault-status.json"));
  });

  it("loadStatusStore returns empty object when file missing", () => {
    const dir = makeTempDir();
    expect(loadStatusStore(dir)).toEqual({});
  });

  it("saveStatusStore and loadStatusStore round-trip", () => {
    const dir = makeTempDir();
    const store = {
      API_KEY: { key: "API_KEY", status: "active" as const, updatedAt: "2024-01-01T00:00:00.000Z" },
    };
    saveStatusStore(dir, store);
    expect(loadStatusStore(dir)).toEqual(store);
  });

  it("setStatus creates a new entry", () => {
    const dir = makeTempDir();
    const entry = setStatus(dir, "DB_PASS", "locked", "Pending rotation");
    expect(entry.key).toBe("DB_PASS");
    expect(entry.status).toBe("locked");
    expect(entry.reason).toBe("Pending rotation");
    expect(entry.updatedAt).toBeTruthy();
  });

  it("setStatus overwrites existing entry", () => {
    const dir = makeTempDir();
    setStatus(dir, "DB_PASS", "active");
    const updated = setStatus(dir, "DB_PASS", "deprecated", "Old key");
    expect(updated.status).toBe("deprecated");
  });

  it("getStatus returns the entry for a key", () => {
    const dir = makeTempDir();
    setStatus(dir, "SECRET", "required");
    const entry = getStatus(dir, "SECRET");
    expect(entry).toBeDefined();
    expect(entry?.status).toBe("required");
  });

  it("getStatus returns undefined for missing key", () => {
    const dir = makeTempDir();
    expect(getStatus(dir, "MISSING")).toBeUndefined();
  });

  it("removeStatus deletes an entry and returns true", () => {
    const dir = makeTempDir();
    setStatus(dir, "TOKEN", "expired");
    expect(removeStatus(dir, "TOKEN")).toBe(true);
    expect(getStatus(dir, "TOKEN")).toBeUndefined();
  });

  it("removeStatus returns false for non-existent key", () => {
    const dir = makeTempDir();
    expect(removeStatus(dir, "GHOST")).toBe(false);
  });

  it("listStatuses returns all entries", () => {
    const dir = makeTempDir();
    setStatus(dir, "A", "active");
    setStatus(dir, "B", "locked");
    const entries = listStatuses(dir);
    expect(entries).toHaveLength(2);
  });

  it("formatStatusList returns message when empty", () => {
    expect(formatStatusList([])).toBe("No status entries found.");
  });

  it("formatStatusList formats entries correctly", () => {
    const dir = makeTempDir();
    setStatus(dir, "API_KEY", "deprecated", "Use v2");
    const entries = listStatuses(dir);
    const output = formatStatusList(entries);
    expect(output).toContain("API_KEY");
    expect(output).toContain("deprecated");
    expect(output).toContain("Use v2");
  });
});
