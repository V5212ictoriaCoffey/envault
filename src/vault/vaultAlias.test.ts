import fs from "fs";
import path from "path";
import os from "os";
import {
  getAliasPath,
  loadAliasStore,
  saveAliasStore,
  addAlias,
  removeAlias,
  resolveAlias,
  listAliases,
} from "./vaultAlias";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-alias-"));
}

describe("vaultAlias", () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("getAliasPath returns correct path", () => {
    expect(getAliasPath(dir)).toBe(path.join(dir, ".vault-aliases.json"));
  });

  it("loadAliasStore returns empty store when file missing", () => {
    const store = loadAliasStore(dir);
    expect(store).toEqual({ aliases: {} });
  });

  it("saveAliasStore and loadAliasStore round-trip", () => {
    const store = { aliases: { DB_URL: "DATABASE_URL" } };
    saveAliasStore(dir, store);
    const loaded = loadAliasStore(dir);
    expect(loaded).toEqual(store);
  });

  it("addAlias stores a new alias", () => {
    const store = addAlias(dir, "db", "DATABASE_URL");
    expect(store.aliases["db"]).toBe("DATABASE_URL");
    const loaded = loadAliasStore(dir);
    expect(loaded.aliases["db"]).toBe("DATABASE_URL");
  });

  it("addAlias overwrites an existing alias", () => {
    addAlias(dir, "db", "DATABASE_URL");
    addAlias(dir, "db", "DB_CONNECTION");
    const loaded = loadAliasStore(dir);
    expect(loaded.aliases["db"]).toBe("DB_CONNECTION");
  });

  it("removeAlias deletes the alias", () => {
    addAlias(dir, "db", "DATABASE_URL");
    removeAlias(dir, "db");
    const loaded = loadAliasStore(dir);
    expect(loaded.aliases["db"]).toBeUndefined();
  });

  it("resolveAlias returns mapped key when alias exists", () => {
    addAlias(dir, "db", "DATABASE_URL");
    expect(resolveAlias(dir, "db")).toBe("DATABASE_URL");
  });

  it("resolveAlias returns input unchanged when alias missing", () => {
    expect(resolveAlias(dir, "UNKNOWN_ALIAS")).toBe("UNKNOWN_ALIAS");
  });

  it("listAliases returns all aliases", () => {
    addAlias(dir, "db", "DATABASE_URL");
    addAlias(dir, "secret", "APP_SECRET");
    const entries = listAliases(dir);
    expect(entries).toHaveLength(2);
    expect(entries).toContainEqual({ alias: "db", key: "DATABASE_URL" });
    expect(entries).toContainEqual({ alias: "secret", key: "APP_SECRET" });
  });

  it("listAliases returns empty array when no aliases", () => {
    expect(listAliases(dir)).toEqual([]);
  });
});
