import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  getFormatPath,
  loadFormatStore,
  saveFormatStore,
  setFormat,
  removeFormat,
  getFormat,
  listFormats,
  isValidFormat,
} from "./vaultFormat";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-format-"));
}

describe("vaultFormat", () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("returns empty store when no file exists", () => {
    expect(loadFormatStore(dir)).toEqual({});
  });

  it("getFormatPath returns correct path", () => {
    expect(getFormatPath(dir)).toBe(path.join(dir, ".vault-format.json"));
  });

  it("saves and loads format store", () => {
    const store = { API_KEY: "json", DB_URL: "dotenv" } as const;
    saveFormatStore(dir, store);
    expect(loadFormatStore(dir)).toEqual(store);
  });

  it("setFormat adds a format entry", () => {
    setFormat(dir, "SECRET_TOKEN", "yaml");
    expect(getFormat(dir, "SECRET_TOKEN")).toBe("yaml");
  });

  it("setFormat overwrites existing entry", () => {
    setFormat(dir, "API_KEY", "json");
    setFormat(dir, "API_KEY", "csv");
    expect(getFormat(dir, "API_KEY")).toBe("csv");
  });

  it("removeFormat deletes an entry", () => {
    setFormat(dir, "DB_URL", "dotenv");
    removeFormat(dir, "DB_URL");
    expect(getFormat(dir, "DB_URL")).toBeUndefined();
  });

  it("getFormat returns undefined for missing key", () => {
    expect(getFormat(dir, "MISSING_KEY")).toBeUndefined();
  });

  it("listFormats returns all entries", () => {
    setFormat(dir, "KEY_A", "json");
    setFormat(dir, "KEY_B", "yaml");
    const list = listFormats(dir);
    expect(list).toHaveLength(2);
    expect(list).toContainEqual({ key: "KEY_A", format: "json" });
    expect(list).toContainEqual({ key: "KEY_B", format: "yaml" });
  });

  it("isValidFormat returns true for valid formats", () => {
    expect(isValidFormat("json")).toBe(true);
    expect(isValidFormat("dotenv")).toBe(true);
    expect(isValidFormat("yaml")).toBe(true);
    expect(isValidFormat("csv")).toBe(true);
  });

  it("isValidFormat returns false for invalid format", () => {
    expect(isValidFormat("toml")).toBe(false);
    expect(isValidFormat("")).toBe(false);
  });
});
