import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  getSourcePath,
  loadSourceStore,
  setSource,
  removeSource,
  getSource,
  listSources,
  getKeysBySource,
} from "./vaultSource";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-source-"));
}

describe("vaultSource", () => {
  it("getSourcePath returns correct path", () => {
    expect(getSourcePath("/my/vault")).toBe("/my/vault/.envault/sources.json");
  });

  it("loadSourceStore returns empty object if file missing", () => {
    const dir = makeTempDir();
    expect(loadSourceStore(dir)).toEqual({});
  });

  it("setSource persists a source entry", () => {
    const dir = makeTempDir();
    const entry = setSource(dir, "API_KEY", "aws-secrets");
    expect(entry.key).toBe("API_KEY");
    expect(entry.source).toBe("aws-secrets");
    expect(entry.addedAt).toBeDefined();
    const loaded = loadSourceStore(dir);
    expect(loaded["API_KEY"]).toEqual(entry);
  });

  it("getSource returns entry for existing key", () => {
    const dir = makeTempDir();
    setSource(dir, "DB_URL", "vault-prod");
    const entry = getSource(dir, "DB_URL");
    expect(entry?.source).toBe("vault-prod");
  });

  it("getSource returns undefined for missing key", () => {
    const dir = makeTempDir();
    expect(getSource(dir, "MISSING")).toBeUndefined();
  });

  it("removeSource deletes an existing entry", () => {
    const dir = makeTempDir();
    setSource(dir, "SECRET", "env-file");
    const result = removeSource(dir, "SECRET");
    expect(result).toBe(true);
    expect(getSource(dir, "SECRET")).toBeUndefined();
  });

  it("removeSource returns false for missing key", () => {
    const dir = makeTempDir();
    expect(removeSource(dir, "NOPE")).toBe(false);
  });

  it("listSources returns all entries", () => {
    const dir = makeTempDir();
    setSource(dir, "A", "source1");
    setSource(dir, "B", "source2");
    const list = listSources(dir);
    expect(list).toHaveLength(2);
  });

  it("getKeysBySource filters by source name", () => {
    const dir = makeTempDir();
    setSource(dir, "X", "aws");
    setSource(dir, "Y", "aws");
    setSource(dir, "Z", "manual");
    const keys = getKeysBySource(dir, "aws");
    expect(keys).toContain("X");
    expect(keys).toContain("Y");
    expect(keys).not.toContain("Z");
  });
});
