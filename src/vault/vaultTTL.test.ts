import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  getTTLPath,
  loadTTLStore,
  saveTTLStore,
  setTTL,
  removeTTL,
  getTTL,
  isExpired,
  listExpiredKeys,
} from "./vaultTTL";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-ttl-"));
}

describe("vaultTTL", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns empty store when no file exists", () => {
    expect(loadTTLStore(tmpDir)).toEqual({});
  });

  it("saves and loads a TTL store", () => {
    const store = { MY_KEY: { key: "MY_KEY", ttlSeconds: 3600, createdAt: new Date().toISOString() } };
    saveTTLStore(tmpDir, store);
    expect(loadTTLStore(tmpDir)).toEqual(store);
  });

  it("sets a TTL entry for a key", () => {
    const entry = setTTL(tmpDir, "API_KEY", 7200);
    expect(entry.key).toBe("API_KEY");
    expect(entry.ttlSeconds).toBe(7200);
    expect(entry.createdAt).toBeDefined();
  });

  it("retrieves a TTL entry by key", () => {
    setTTL(tmpDir, "DB_PASS", 1800);
    const entry = getTTL(tmpDir, "DB_PASS");
    expect(entry).not.toBeNull();
    expect(entry!.ttlSeconds).toBe(1800);
  });

  it("returns null for missing key", () => {
    expect(getTTL(tmpDir, "MISSING_KEY")).toBeNull();
  });

  it("removes a TTL entry", () => {
    setTTL(tmpDir, "TOKEN", 600);
    const removed = removeTTL(tmpDir, "TOKEN");
    expect(removed).toBe(true);
    expect(getTTL(tmpDir, "TOKEN")).toBeNull();
  });

  it("returns false when removing non-existent key", () => {
    expect(removeTTL(tmpDir, "GHOST")).toBe(false);
  });

  it("detects expired entries", () => {
    const past = new Date(Date.now() - 10000).toISOString();
    const entry = { key: "OLD_KEY", ttlSeconds: 5, createdAt: past };
    expect(isExpired(entry)).toBe(true);
  });

  it("detects non-expired entries", () => {
    const entry = { key: "FRESH_KEY", ttlSeconds: 9999, createdAt: new Date().toISOString() };
    expect(isExpired(entry)).toBe(false);
  });

  it("lists expired keys", () => {
    const past = new Date(Date.now() - 20000).toISOString();
    saveTTLStore(tmpDir, {
      OLD: { key: "OLD", ttlSeconds: 1, createdAt: past },
      FRESH: { key: "FRESH", ttlSeconds: 99999, createdAt: new Date().toISOString() },
    });
    const expired = listExpiredKeys(tmpDir);
    expect(expired).toContain("OLD");
    expect(expired).not.toContain("FRESH");
  });
});
