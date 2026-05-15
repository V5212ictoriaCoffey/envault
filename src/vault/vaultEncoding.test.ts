import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  getEncodingPath,
  loadEncodingStore,
  saveEncodingStore,
  setEncoding,
  removeEncoding,
  getEncoding,
  listEncodings,
  encodeValue,
  decodeValue,
} from "./vaultEncoding";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-encoding-"));
}

describe("vaultEncoding", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("getEncodingPath returns correct path", () => {
    expect(getEncodingPath(tmpDir)).toBe(path.join(tmpDir, ".encoding.json"));
  });

  test("loadEncodingStore returns empty object when file missing", () => {
    expect(loadEncodingStore(tmpDir)).toEqual({});
  });

  test("saveEncodingStore and loadEncodingStore round-trip", () => {
    const store = { API_KEY: "base64", TOKEN: "hex" } as any;
    saveEncodingStore(tmpDir, store);
    expect(loadEncodingStore(tmpDir)).toEqual(store);
  });

  test("setEncoding stores encoding for key", () => {
    setEncoding(tmpDir, "SECRET", "base64");
    expect(getEncoding(tmpDir, "SECRET")).toBe("base64");
  });

  test("removeEncoding deletes key encoding", () => {
    setEncoding(tmpDir, "SECRET", "hex");
    removeEncoding(tmpDir, "SECRET");
    expect(getEncoding(tmpDir, "SECRET")).toBeUndefined();
  });

  test("listEncodings returns all stored encodings", () => {
    setEncoding(tmpDir, "A", "base64");
    setEncoding(tmpDir, "B", "url");
    const result = listEncodings(tmpDir);
    expect(result).toEqual({ A: "base64", B: "url" });
  });

  test("encodeValue and decodeValue base64 round-trip", () => {
    const original = "my-secret-value";
    const encoded = encodeValue(original, "base64");
    expect(encoded).not.toBe(original);
    expect(decodeValue(encoded, "base64")).toBe(original);
  });

  test("encodeValue and decodeValue hex round-trip", () => {
    const original = "hex-secret";
    const encoded = encodeValue(original, "hex");
    expect(decodeValue(encoded, "hex")).toBe(original);
  });

  test("encodeValue and decodeValue url round-trip", () => {
    const original = "value with spaces & symbols=1";
    const encoded = encodeValue(original, "url");
    expect(decodeValue(encoded, "url")).toBe(original);
  });

  test("encodeValue utf8 returns value unchanged", () => {
    expect(encodeValue("plain", "utf8")).toBe("plain");
  });
});
