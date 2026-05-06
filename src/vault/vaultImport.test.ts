import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { resolveEnvFilePath, readEnvFile, importEnvToVault } from "./vaultImport";
import { createVault, saveVault } from "./vault";
import { generateKeyPair, saveKeyPair } from "../crypto/keyPair";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-import-test-"));
}

describe("resolveEnvFilePath", () => {
  it("returns absolute path unchanged", () => {
    expect(resolveEnvFilePath("/tmp/test.env")).toBe("/tmp/test.env");
  });

  it("resolves relative path against cwd", () => {
    const result = resolveEnvFilePath("test.env");
    expect(result).toBe(path.resolve(process.cwd(), "test.env"));
  });
});

describe("readEnvFile", () => {
  it("parses an env file into a record", () => {
    const dir = makeTempDir();
    const filePath = path.join(dir, ".env");
    fs.writeFileSync(filePath, "FOO=bar\nBAZ=qux\n");
    const result = readEnvFile(filePath);
    expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("throws if file does not exist", () => {
    expect(() => readEnvFile("/nonexistent/path/.env")).toThrow("File not found");
  });
});

describe("importEnvToVault", () => {
  it("imports env keys into vault", async () => {
    const dir = makeTempDir();
    const { publicKey, privateKey } = await generateKeyPair();
    const pubKeyPath = path.join(dir, "public.pem");
    fs.writeFileSync(pubKeyPath, publicKey);

    const vaultPath = path.join(dir, "vault.json");
    const vault = createVault("test-vault");
    saveVault(vaultPath, vault);

    const envPath = path.join(dir, ".env");
    fs.writeFileSync(envPath, "API_KEY=secret123\nDB_URL=postgres://localhost/db\n");

    const { imported, skipped } = await importEnvToVault(envPath, vaultPath, pubKeyPath);
    expect(imported).toContain("API_KEY");
    expect(imported).toContain("DB_URL");
    expect(skipped).toHaveLength(0);
  });

  it("skips existing keys when overwrite is false", async () => {
    const dir = makeTempDir();
    const { publicKey } = await generateKeyPair();
    const pubKeyPath = path.join(dir, "public.pem");
    fs.writeFileSync(pubKeyPath, publicKey);

    const envPath = path.join(dir, ".env");
    fs.writeFileSync(envPath, "API_KEY=secret123\n");

    const vaultPath = path.join(dir, "vault.json");
    const vault = createVault("test-vault");
    saveVault(vaultPath, vault);

    await importEnvToVault(envPath, vaultPath, pubKeyPath);
    const { imported, skipped } = await importEnvToVault(envPath, vaultPath, pubKeyPath);
    expect(skipped).toContain("API_KEY");
    expect(imported).toHaveLength(0);
  });
});
