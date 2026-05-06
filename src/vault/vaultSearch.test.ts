import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchVaultKeys, searchVaultDecrypted } from "./vaultSearch";
import { Vault } from "./vault";
import * as crypto from "../crypto";

const makeVault = (): Vault => ({
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  entries: {
    DATABASE_URL: { encryptedValue: "abc123encryptedXYZ", iv: "iv1" },
    DATABASE_PASSWORD: { encryptedValue: "def456encryptedXYZ", iv: "iv2" },
    API_KEY: { encryptedValue: "ghi789encryptedXYZ", iv: "iv3" },
    SECRET_TOKEN: { encryptedValue: "jkl012encryptedXYZ", iv: "iv4" },
  },
});

describe("searchVaultKeys", () => {
  it("returns matching keys (case-insensitive by default)", () => {
    const vault = makeVault();
    const results = searchVaultKeys(vault, "database");
    expect(results.map((r) => r.key)).toEqual(["DATABASE_URL", "DATABASE_PASSWORD"]);
  });

  it("returns matching keys case-sensitively", () => {
    const vault = makeVault();
    const results = searchVaultKeys(vault, "DATABASE", { caseSensitive: true });
    expect(results.map((r) => r.key)).toEqual(["DATABASE_URL", "DATABASE_PASSWORD"]);
  });

  it("returns no results for non-matching query", () => {
    const vault = makeVault();
    const results = searchVaultKeys(vault, "NONEXISTENT");
    expect(results).toHaveLength(0);
  });

  it("returns all keys for empty query", () => {
    const vault = makeVault();
    const results = searchVaultKeys(vault, "");
    expect(results).toHaveLength(4);
  });

  it("includes a masked preview of the encrypted value", () => {
    const vault = makeVault();
    const results = searchVaultKeys(vault, "API_KEY");
    expect(results[0].preview).toMatch(/^.{12}\.\.\./);
  });

  it("does not match with wrong case when caseSensitive is true", () => {
    const vault = makeVault();
    const results = searchVaultKeys(vault, "database", { caseSensitive: true });
    expect(results).toHaveLength(0);
  });
});

describe("searchVaultDecrypted", () => {
  beforeEach(() => {
    vi.spyOn(crypto, "decryptEnvRecord").mockImplementation((_entry, _key) => "decrypted_value");
  });

  it("returns decrypted values for matching keys", async () => {
    const vault = makeVault();
    const results = await searchVaultDecrypted(vault, "api", "private-key");
    expect(results).toEqual([{ key: "API_KEY", value: "decrypted_value" }]);
  });

  it("handles decryption failure gracefully", async () => {
    vi.spyOn(crypto, "decryptEnvRecord").mockImplementation(() => {
      throw new Error("bad key");
    });
    const vault = makeVault();
    const results = await searchVaultDecrypted(vault, "secret", "bad-key");
    expect(results[0].value).toBe("<decryption failed>");
  });

  it("returns empty array for no matches", async () => {
    const vault = makeVault();
    const results = await searchVaultDecrypted(vault, "ZZZNOMATCH", "private-key");
    expect(results).toHaveLength(0);
  });
});
