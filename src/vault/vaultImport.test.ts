import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { importEnvToVault, resolveEnvFilePath } from "./vaultImport";
import { createVault, saveVault, loadVault } from "./vault";
import { generateKeyPair, saveKeyPair } from "../crypto/keyPair";

async function makeTempEnv(): Promise<{ dir: string; envPath: string; pubKeyPath: string }> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-import-"));
  const { publicKey, privateKey } = await generateKeyPair();
  const pubKeyPath = path.join(dir, "public.pem");
  const privKeyPath = path.join(dir, "private.pem");
  saveKeyPair(pubKeyPath, privKeyPath, publicKey, privateKey);

  const envPath = path.join(dir, ".env");
  fs.writeFileSync(envPath, "API_KEY=abc123\nDB_URL=postgres://localhost/test\n");

  return { dir, envPath, pubKeyPath };
}

describe("importEnvToVault", () => {
  it("imports all keys from a .env file into a new vault", async () => {
    const { envPath, pubKeyPath } = await makeTempEnv();
    const { vault, result } = await importEnvToVault(envPath, pubKeyPath, null);

    expect(result.imported).toContain("API_KEY");
    expect(result.imported).toContain("DB_URL");
    expect(result.skipped).toHaveLength(0);
    expect(result.total).toBe(2);
    expect(Object.keys(vault.entries)).toHaveLength(2);
  });

  it("skips existing keys when overwrite is false", async () => {
    const { envPath, pubKeyPath } = await makeTempEnv();
    const existing = createVault(pubKeyPath);
    const { vault: first } = await importEnvToVault(envPath, pubKeyPath, existing);

    const { result } = await importEnvToVault(envPath, pubKeyPath, first, { overwrite: false });
    expect(result.skipped).toContain("API_KEY");
    expect(result.skipped).toContain("DB_URL");
    expect(result.imported).toHaveLength(0);
  });

  it("overwrites existing keys when overwrite is true", async () => {
    const { envPath, pubKeyPath } = await makeTempEnv();
    const existing = createVault(pubKeyPath);
    const { vault: first } = await importEnvToVault(envPath, pubKeyPath, existing);
    const oldEntry = first.entries["API_KEY"];

    const { vault: second, result } = await importEnvToVault(envPath, pubKeyPath, first, { overwrite: true });
    expect(result.imported).toContain("API_KEY");
    expect(result.skipped).toHaveLength(0);
    // Entry should be re-encrypted (ciphertext may differ)
    expect(second.entries["API_KEY"]).toBeDefined();
  });
});

describe("resolveEnvFilePath", () => {
  it("returns absolute path when provided", () => {
    const result = resolveEnvFilePath("/tmp/my.env");
    expect(path.isAbsolute(result)).toBe(true);
    expect(result).toBe("/tmp/my.env");
  });

  it("defaults to .env in cwd when no path given", () => {
    const result = resolveEnvFilePath();
    expect(result).toBe(path.join(process.cwd(), ".env"));
  });
});
