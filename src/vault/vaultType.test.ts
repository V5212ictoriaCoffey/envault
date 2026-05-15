import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  getTypePath,
  loadTypeStore,
  saveTypeStore,
  setType,
  removeType,
  getType,
  validateValueType,
  listTypedKeys,
} from "./vaultType";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-type-test-"));
}

describe("vaultType", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("getTypePath returns correct path", () => {
    expect(getTypePath(tmpDir)).toBe(path.join(tmpDir, ".envault-types.json"));
  });

  test("loadTypeStore returns empty object when file missing", () => {
    expect(loadTypeStore(tmpDir)).toEqual({});
  });

  test("saveTypeStore and loadTypeStore round-trip", () => {
    const store = { API_KEY: "string" as const, PORT: "number" as const };
    saveTypeStore(tmpDir, store);
    expect(loadTypeStore(tmpDir)).toEqual(store);
  });

  test("setType adds a type entry", () => {
    setType(tmpDir, "DATABASE_URL", "url");
    expect(getType(tmpDir, "DATABASE_URL")).toBe("url");
  });

  test("removeType deletes an entry", () => {
    setType(tmpDir, "SECRET", "string");
    removeType(tmpDir, "SECRET");
    expect(getType(tmpDir, "SECRET")).toBeUndefined();
  });

  test("listTypedKeys returns all entries", () => {
    setType(tmpDir, "PORT", "number");
    setType(tmpDir, "DEBUG", "boolean");
    const list = listTypedKeys(tmpDir);
    expect(list).toContainEqual({ key: "PORT", type: "number" });
    expect(list).toContainEqual({ key: "DEBUG", type: "boolean" });
  });

  describe("validateValueType", () => {
    test("validates number", () => {
      expect(validateValueType("42", "number")).toBe(true);
      expect(validateValueType("abc", "number")).toBe(false);
    });
    test("validates boolean", () => {
      expect(validateValueType("true", "boolean")).toBe(true);
      expect(validateValueType("yes", "boolean")).toBe(false);
    });
    test("validates url", () => {
      expect(validateValueType("https://example.com", "url")).toBe(true);
      expect(validateValueType("not-a-url", "url")).toBe(false);
    });
    test("validates email", () => {
      expect(validateValueType("user@example.com", "email")).toBe(true);
      expect(validateValueType("notanemail", "email")).toBe(false);
    });
    test("validates json", () => {
      expect(validateValueType('{"a":1}', "json")).toBe(true);
      expect(validateValueType("bad json{", "json")).toBe(false);
    });
    test("validates string always true", () => {
      expect(validateValueType("anything", "string")).toBe(true);
    });
  });
});
