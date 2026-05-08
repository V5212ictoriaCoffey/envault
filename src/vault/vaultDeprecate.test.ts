import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  getDeprecatePath,
  loadDeprecateStore,
  deprecateKey,
  undeprecateKey,
  isDeprecated,
  listDeprecated,
  formatDeprecations,
} from "./vaultDeprecate";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-deprecate-"));
}

describe("vaultDeprecate", () => {
  it("getDeprecatePath returns correct path", () => {
    expect(getDeprecatePath("/vault")).toBe("/vault/.deprecations.json");
  });

  it("loadDeprecateStore returns empty object when file missing", () => {
    const dir = makeTempDir();
    expect(loadDeprecateStore(dir)).toEqual({});
  });

  it("deprecateKey stores an entry with timestamp", () => {
    const dir = makeTempDir();
    const store = deprecateKey(dir, "OLD_API_KEY", "no longer used");
    expect(store["OLD_API_KEY"]).toBeDefined();
    expect(store["OLD_API_KEY"].reason).toBe("no longer used");
    expect(store["OLD_API_KEY"].deprecatedAt).toBeTruthy();
  });

  it("deprecateKey stores replacedBy when provided", () => {
    const dir = makeTempDir();
    const store = deprecateKey(dir, "OLD_KEY", undefined, "NEW_KEY");
    expect(store["OLD_KEY"].replacedBy).toBe("NEW_KEY");
  });

  it("undeprecateKey removes the entry", () => {
    const dir = makeTempDir();
    deprecateKey(dir, "SOME_KEY");
    const store = undeprecateKey(dir, "SOME_KEY");
    expect(store["SOME_KEY"]).toBeUndefined();
  });

  it("isDeprecated returns true for deprecated key", () => {
    const dir = makeTempDir();
    deprecateKey(dir, "TOKEN");
    expect(isDeprecated(dir, "TOKEN")).toBe(true);
  });

  it("isDeprecated returns false for non-deprecated key", () => {
    const dir = makeTempDir();
    expect(isDeprecated(dir, "FRESH_KEY")).toBe(false);
  });

  it("listDeprecated returns all deprecated keys", () => {
    const dir = makeTempDir();
    deprecateKey(dir, "A");
    deprecateKey(dir, "B");
    expect(listDeprecated(dir)).toEqual(expect.arrayContaining(["A", "B"]));
  });

  it("formatDeprecations returns no-deprecated message for empty store", () => {
    expect(formatDeprecations({})).toBe("No deprecated keys.");
  });

  it("formatDeprecations includes key info", () => {
    const dir = makeTempDir();
    deprecateKey(dir, "OLD", "outdated", "NEW");
    const store = loadDeprecateStore(dir);
    const out = formatDeprecations(store);
    expect(out).toContain("OLD");
    expect(out).toContain("outdated");
    expect(out).toContain("NEW");
  });
});
