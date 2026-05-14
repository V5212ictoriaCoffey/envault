import fs from "fs";
import os from "os";
import path from "path";
import {
  getPriorityPath,
  loadPriorityStore,
  savePriorityStore,
  setPriority,
  removePriority,
  getPriority,
  listByPriority,
} from "./vaultPriority";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-priority-"));
}

describe("vaultPriority", () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("returns empty store when no file exists", () => {
    expect(loadPriorityStore(dir)).toEqual({});
  });

  it("getPriorityPath returns correct path", () => {
    expect(getPriorityPath(dir)).toBe(path.join(dir, ".priority.json"));
  });

  it("saves and loads priority store", () => {
    const store = { MY_KEY: "high" as const };
    savePriorityStore(dir, store);
    expect(loadPriorityStore(dir)).toEqual(store);
  });

  it("setPriority adds a key with priority level", () => {
    setPriority(dir, "DB_PASSWORD", "critical");
    expect(getPriority(dir, "DB_PASSWORD")).toBe("critical");
  });

  it("setPriority overwrites existing priority", () => {
    setPriority(dir, "API_KEY", "low");
    setPriority(dir, "API_KEY", "high");
    expect(getPriority(dir, "API_KEY")).toBe("high");
  });

  it("removePriority deletes a key", () => {
    setPriority(dir, "TOKEN", "medium");
    removePriority(dir, "TOKEN");
    expect(getPriority(dir, "TOKEN")).toBeUndefined();
  });

  it("getPriority returns undefined for unknown key", () => {
    expect(getPriority(dir, "UNKNOWN")).toBeUndefined();
  });

  it("listByPriority returns keys matching the given level", () => {
    setPriority(dir, "DB_PASS", "critical");
    setPriority(dir, "DB_HOST", "low");
    setPriority(dir, "SECRET", "critical");
    const results = listByPriority(dir, "critical");
    expect(results).toContain("DB_PASS");
    expect(results).toContain("SECRET");
    expect(results).not.toContain("DB_HOST");
  });

  it("listByPriority returns empty array when no matches", () => {
    setPriority(dir, "KEY", "low");
    expect(listByPriority(dir, "critical")).toEqual([]);
  });
});
