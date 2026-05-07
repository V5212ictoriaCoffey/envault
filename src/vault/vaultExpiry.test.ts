import fs from "fs";
import os from "os";
import path from "path";
import {
  getExpiryPath,
  loadExpiryStore,
  setExpiry,
  removeExpiry,
  getExpiry,
  isExpired,
  listExpiredKeys,
  listExpiryEntries,
} from "./vaultExpiry";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-expiry-"));
}

describe("vaultExpiry", () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true });
  });

  it("returns empty store when no file exists", () => {
    expect(loadExpiryStore(dir)).toEqual({});
  });

  it("getExpiryPath returns correct path", () => {
    expect(getExpiryPath(dir)).toBe(path.join(dir, ".vault-expiry.json"));
  });

  it("setExpiry persists expiry date", () => {
    const date = new Date("2099-01-01T00:00:00.000Z");
    setExpiry(dir, "API_KEY", date);
    const store = loadExpiryStore(dir);
    expect(store["API_KEY"]).toBe(date.toISOString());
  });

  it("getExpiry returns null for unknown key", () => {
    expect(getExpiry(dir, "MISSING")).toBeNull();
  });

  it("getExpiry returns Date for known key", () => {
    const date = new Date("2099-06-15T12:00:00.000Z");
    setExpiry(dir, "DB_PASS", date);
    expect(getExpiry(dir, "DB_PASS")?.toISOString()).toBe(date.toISOString());
  });

  it("removeExpiry deletes the key", () => {
    setExpiry(dir, "TOKEN", new Date("2099-01-01"));
    removeExpiry(dir, "TOKEN");
    expect(getExpiry(dir, "TOKEN")).toBeNull();
  });

  it("isExpired returns false for future date", () => {
    setExpiry(dir, "FUTURE", new Date("2099-01-01"));
    expect(isExpired(dir, "FUTURE")).toBe(false);
  });

  it("isExpired returns true for past date", () => {
    setExpiry(dir, "PAST", new Date("2000-01-01"));
    expect(isExpired(dir, "PAST")).toBe(true);
  });

  it("isExpired returns false for key with no expiry", () => {
    expect(isExpired(dir, "NO_EXPIRY")).toBe(false);
  });

  it("listExpiredKeys returns only expired keys", () => {
    setExpiry(dir, "OLD", new Date("2000-01-01"));
    setExpiry(dir, "NEW", new Date("2099-01-01"));
    expect(listExpiredKeys(dir)).toEqual(["OLD"]);
  });

  it("listExpiryEntries returns all entries with expired flag", () => {
    setExpiry(dir, "OLD", new Date("2000-01-01"));
    setExpiry(dir, "NEW", new Date("2099-01-01"));
    const entries = listExpiryEntries(dir);
    expect(entries).toHaveLength(2);
    const old = entries.find((e) => e.key === "OLD");
    const fresh = entries.find((e) => e.key === "NEW");
    expect(old?.expired).toBe(true);
    expect(fresh?.expired).toBe(false);
  });
});
