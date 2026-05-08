import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  getChecksumPath,
  loadChecksumStore,
  saveChecksumStore,
  computeChecksum,
  setChecksum,
  removeChecksum,
  verifyChecksum,
  detectTamperedKeys,
} from "./vaultChecksum";
import { Vault } from "./vault";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-checksum-test-"));
}

describe("vaultChecksum", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("getChecksumPath returns correct path", () => {
    expect(getChecksumPath(tmpDir)).toBe(path.join(tmpDir, ".envault-checksums.json"));
  });

  test("loadChecksumStore returns empty object when file missing", () => {
    expect(loadChecksumStore(tmpDir)).toEqual({});
  });

  test("saveChecksumStore and loadChecksumStore round-trip", () => {
    const store = { API_KEY: "abc123hash" };
    saveChecksumStore(tmpDir, store);
    expect(loadChecksumStore(tmpDir)).toEqual(store);
  });

  test("computeChecksum returns consistent sha256 hex", () => {
    const hash = computeChecksum("hello");
    expect(hash).toHaveLength(64);
    expect(computeChecksum("hello")).toBe(hash);
    expect(computeChecksum("world")).not.toBe(hash);
  });

  test("setChecksum stores hash for key", () => {
    setChecksum(tmpDir, "DB_PASS", "encrypted-value");
    const store = loadChecksumStore(tmpDir);
    expect(store["DB_PASS"]).toBe(computeChecksum("encrypted-value"));
  });

  test("removeChecksum deletes key", () => {
    setChecksum(tmpDir, "DB_PASS", "val");
    removeChecksum(tmpDir, "DB_PASS");
    expect(loadChecksumStore(tmpDir)["DB_PASS"]).toBeUndefined();
  });

  test("verifyChecksum returns true for matching value", () => {
    setChecksum(tmpDir, "TOKEN", "my-secret");
    expect(verifyChecksum(tmpDir, "TOKEN", "my-secret")).toBe(true);
  });

  test("verifyChecksum returns false for tampered value", () => {
    setChecksum(tmpDir, "TOKEN", "my-secret");
    expect(verifyChecksum(tmpDir, "TOKEN", "tampered")).toBe(false);
  });

  test("verifyChecksum returns false for unknown key", () => {
    expect(verifyChecksum(tmpDir, "UNKNOWN", "anything")).toBe(false);
  });

  test("detectTamperedKeys returns keys with mismatched checksums", () => {
    const vault: Vault = {
      version: 1,
      secrets: { API_KEY: "enc-val-1", DB_URL: "enc-val-2" },
    };
    setChecksum(tmpDir, "API_KEY", "enc-val-1");
    setChecksum(tmpDir, "DB_URL", "original-val");
    const tampered = detectTamperedKeys(vault, tmpDir);
    expect(tampered).not.toContain("API_KEY");
    expect(tampered).toContain("DB_URL");
  });
});
