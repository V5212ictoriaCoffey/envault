import fs from "fs";
import os from "os";
import path from "path";
import {
  getAliasPath,
  loadAliasStore,
  addAlias,
  removeAlias,
  resolveAlias,
  listAliases,
} from "./vaultAlias";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-alias-"));
}

describe("vaultAlias", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("getAliasPath returns correct path", () => {
    expect(getAliasPath(tmpDir)).toBe(
      path.join(tmpDir, ".envault-aliases.json")
    );
  });

  test("loadAliasStore returns empty store when file missing", () => {
    const store = loadAliasStore(tmpDir);
    expect(store.aliases).toEqual({});
  });

  test("addAlias creates and persists an alias", () => {
    const store = addAlias(tmpDir, "DB", "DATABASE_URL");
    expect(store.aliases["DB"]).toBe("DATABASE_URL");
    const loaded = loadAliasStore(tmpDir);
    expect(loaded.aliases["DB"]).toBe("DATABASE_URL");
  });

  test("addAlias throws on invalid alias name", () => {
    expect(() => addAlias(tmpDir, "my-alias!", "SOME_KEY")).toThrow(
      /Invalid alias/
    );
  });

  test("addAlias throws if alias already points to a different key", () => {
    addAlias(tmpDir, "DB", "DATABASE_URL");
    expect(() => addAlias(tmpDir, "DB", "OTHER_KEY")).toThrow(
      /already points to/
    );
  });

  test("addAlias is idempotent for same key", () => {
    addAlias(tmpDir, "DB", "DATABASE_URL");
    const store = addAlias(tmpDir, "DB", "DATABASE_URL");
    expect(store.aliases["DB"]).toBe("DATABASE_URL");
  });

  test("removeAlias removes an existing alias", () => {
    addAlias(tmpDir, "DB", "DATABASE_URL");
    const store = removeAlias(tmpDir, "DB");
    expect(store.aliases["DB"]).toBeUndefined();
  });

  test("removeAlias throws if alias does not exist", () => {
    expect(() => removeAlias(tmpDir, "MISSING")).toThrow(/not found/);
  });

  test("resolveAlias returns canonical key for known alias", () => {
    addAlias(tmpDir, "DB", "DATABASE_URL");
    expect(resolveAlias(tmpDir, "DB")).toBe("DATABASE_URL");
  });

  test("resolveAlias returns input unchanged for unknown alias", () => {
    expect(resolveAlias(tmpDir, "UNKNOWN_KEY")).toBe("UNKNOWN_KEY");
  });

  test("listAliases returns all alias entries", () => {
    addAlias(tmpDir, "DB", "DATABASE_URL");
    addAlias(tmpDir, "SECRET", "API_SECRET_KEY");
    const entries = listAliases(tmpDir);
    expect(entries).toHaveLength(2);
    expect(entries).toContainEqual({ alias: "DB", key: "DATABASE_URL" });
    expect(entries).toContainEqual({ alias: "SECRET", key: "API_SECRET_KEY" });
  });
});
