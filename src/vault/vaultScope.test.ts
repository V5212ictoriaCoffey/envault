import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  getScopePath,
  loadScopeStore,
  saveScopeStore,
  setScope,
  removeScope,
  getScope,
  getKeysByScope,
  formatScopeList,
} from "./vaultScope";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-scope-"));
}

describe("vaultScope", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("getScopePath returns correct path", () => {
    expect(getScopePath(tmpDir)).toBe(path.join(tmpDir, ".envault", "scope.json"));
  });

  test("loadScopeStore returns empty object when file missing", () => {
    expect(loadScopeStore(tmpDir)).toEqual({});
  });

  test("saveScopeStore and loadScopeStore round-trip", () => {
    const store = { API_KEY: "shared", DB_PASS: "local" } as any;
    saveScopeStore(tmpDir, store);
    expect(loadScopeStore(tmpDir)).toEqual(store);
  });

  test("setScope adds entry", () => {
    setScope(tmpDir, "SECRET", "global");
    expect(getScope(tmpDir, "SECRET")).toBe("global");
  });

  test("setScope overwrites existing entry", () => {
    setScope(tmpDir, "SECRET", "local");
    setScope(tmpDir, "SECRET", "shared");
    expect(getScope(tmpDir, "SECRET")).toBe("shared");
  });

  test("removeScope deletes entry", () => {
    setScope(tmpDir, "TOKEN", "local");
    removeScope(tmpDir, "TOKEN");
    expect(getScope(tmpDir, "TOKEN")).toBeUndefined();
  });

  test("getKeysByScope filters correctly", () => {
    setScope(tmpDir, "A", "local");
    setScope(tmpDir, "B", "shared");
    setScope(tmpDir, "C", "local");
    expect(getKeysByScope(tmpDir, "local").sort()).toEqual(["A", "C"]);
    expect(getKeysByScope(tmpDir, "shared")).toEqual(["B"]);
  });

  test("formatScopeList returns no-entry message for empty store", () => {
    expect(formatScopeList({})).toMatch(/No scope/);
  });

  test("formatScopeList formats entries", () => {
    const result = formatScopeList({ API_KEY: "shared", DB_PASS: "local" });
    expect(result).toContain("API_KEY: shared");
    expect(result).toContain("DB_PASS: local");
  });
});
