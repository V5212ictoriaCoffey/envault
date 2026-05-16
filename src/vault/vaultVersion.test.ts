import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  getVersionPath,
  loadVersionStore,
  saveVersionStore,
  bumpVersion,
  getVersion,
  removeVersionEntry,
  listVersions,
} from "./vaultVersion";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-version-"));
}

describe("vaultVersion", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("getVersionPath returns correct path", () => {
    const p = getVersionPath(tmpDir);
    expect(p).toContain(".vault");
    expect(p).toContain("versions.json");
  });

  it("loadVersionStore returns empty object when file missing", () => {
    const store = loadVersionStore(tmpDir);
    expect(store).toEqual({});
  });

  it("saveVersionStore and loadVersionStore round-trip", () => {
    const store = {
      MY_KEY: { key: "MY_KEY", version: 3, updatedAt: "2024-01-01T00:00:00.000Z" },
    };
    saveVersionStore(tmpDir, store);
    const loaded = loadVersionStore(tmpDir);
    expect(loaded).toEqual(store);
  });

  it("bumpVersion creates entry with version 1 for new key", () => {
    const entry = bumpVersion(tmpDir, "API_KEY");
    expect(entry.key).toBe("API_KEY");
    expect(entry.version).toBe(1);
    expect(entry.updatedAt).toBeTruthy();
  });

  it("bumpVersion increments version on subsequent calls", () => {
    bumpVersion(tmpDir, "API_KEY");
    bumpVersion(tmpDir, "API_KEY");
    const entry = bumpVersion(tmpDir, "API_KEY");
    expect(entry.version).toBe(3);
  });

  it("getVersion returns entry for existing key", () => {
    bumpVersion(tmpDir, "DB_PASS");
    const entry = getVersion(tmpDir, "DB_PASS");
    expect(entry).toBeDefined();
    expect(entry?.key).toBe("DB_PASS");
  });

  it("getVersion returns undefined for missing key", () => {
    expect(getVersion(tmpDir, "MISSING")).toBeUndefined();
  });

  it("removeVersionEntry removes existing entry and returns true", () => {
    bumpVersion(tmpDir, "TOKEN");
    const result = removeVersionEntry(tmpDir, "TOKEN");
    expect(result).toBe(true);
    expect(getVersion(tmpDir, "TOKEN")).toBeUndefined();
  });

  it("removeVersionEntry returns false for missing key", () => {
    expect(removeVersionEntry(tmpDir, "GHOST")).toBe(false);
  });

  it("listVersions returns all entries sorted by version descending", () => {
    bumpVersion(tmpDir, "A");
    bumpVersion(tmpDir, "B");
    bumpVersion(tmpDir, "A");
    const list = listVersions(tmpDir);
    expect(list.length).toBe(2);
    expect(list[0].version).toBeGreaterThanOrEqual(list[1].version);
  });
});
