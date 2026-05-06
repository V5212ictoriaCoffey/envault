import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  getPinPath,
  loadPinStore,
  savePinStore,
  pinKey,
  unpinKey,
  getPinnedKeys,
  isPinned,
  formatPinList,
} from "./vaultPin";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-pin-"));
}

describe("vaultPin", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("getPinPath returns correct path", () => {
    expect(getPinPath(tmpDir)).toBe(path.join(tmpDir, ".pins.json"));
  });

  it("loadPinStore returns empty store when file missing", () => {
    const store = loadPinStore(tmpDir);
    expect(store.pins).toEqual({});
    expect(store.pinnedAt).toEqual({});
  });

  it("savePinStore and loadPinStore round-trip", () => {
    const store = { pins: { API_KEY: "production" }, pinnedAt: { API_KEY: "2024-01-01T00:00:00.000Z" } };
    savePinStore(tmpDir, store);
    const loaded = loadPinStore(tmpDir);
    expect(loaded).toEqual(store);
  });

  it("pinKey adds a key with alias and timestamp", () => {
    const store = pinKey(tmpDir, "DB_URL", "staging");
    expect(store.pins["DB_URL"]).toBe("staging");
    expect(store.pinnedAt["DB_URL"]).toBeDefined();
  });

  it("unpinKey removes a key", () => {
    pinKey(tmpDir, "DB_URL", "staging");
    const store = unpinKey(tmpDir, "DB_URL");
    expect(store.pins["DB_URL"]).toBeUndefined();
    expect(store.pinnedAt["DB_URL"]).toBeUndefined();
  });

  it("getPinnedKeys returns all pinned keys", () => {
    pinKey(tmpDir, "API_KEY", "prod");
    pinKey(tmpDir, "SECRET", "dev");
    const keys = getPinnedKeys(tmpDir);
    expect(keys).toContain("API_KEY");
    expect(keys).toContain("SECRET");
  });

  it("isPinned returns true for pinned key", () => {
    pinKey(tmpDir, "TOKEN", "prod");
    expect(isPinned(tmpDir, "TOKEN")).toBe(true);
    expect(isPinned(tmpDir, "OTHER")).toBe(false);
  });

  it("formatPinList returns message when no pins", () => {
    const store = loadPinStore(tmpDir);
    expect(formatPinList(store)).toBe("No pinned keys.");
  });

  it("formatPinList formats pins correctly", () => {
    pinKey(tmpDir, "API_KEY", "prod");
    const store = loadPinStore(tmpDir);
    const output = formatPinList(store);
    expect(output).toContain("API_KEY");
    expect(output).toContain("prod");
  });
});
