import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { initCommand } from "./init";

describe("initCommand", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-init-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates key files and vault on fresh init", async () => {
    const keyDir = path.join(tmpDir, ".envault-keys");
    const vaultFile = path.join(tmpDir, ".envault");

    await initCommand({ keyDir, vaultFile });

    expect(fs.existsSync(path.join(keyDir, "public.pem"))).toBe(true);
    expect(fs.existsSync(path.join(keyDir, "private.pem"))).toBe(true);
    expect(fs.existsSync(vaultFile)).toBe(true);
  });

  it("throws if vault file already exists without --force", async () => {
    const keyDir = path.join(tmpDir, ".envault-keys");
    const vaultFile = path.join(tmpDir, ".envault");

    fs.writeFileSync(vaultFile, "{}");

    await expect(initCommand({ keyDir, vaultFile })).rejects.toThrow(
      "Vault file already exists"
    );
  });

  it("overwrites existing files when --force is set", async () => {
    const keyDir = path.join(tmpDir, ".envault-keys");
    const vaultFile = path.join(tmpDir, ".envault");

    await initCommand({ keyDir, vaultFile });
    await expect(
      initCommand({ keyDir, vaultFile, force: true })
    ).resolves.not.toThrow();

    expect(fs.existsSync(vaultFile)).toBe(true);
  });

  it("throws if key directory already exists without --force", async () => {
    const keyDir = path.join(tmpDir, ".envault-keys");
    const vaultFile = path.join(tmpDir, ".envault");

    fs.mkdirSync(keyDir, { recursive: true });

    await expect(initCommand({ keyDir, vaultFile })).rejects.toThrow(
      "Key directory already exists"
    );
  });
});
