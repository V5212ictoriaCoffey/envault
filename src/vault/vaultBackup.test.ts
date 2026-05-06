import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  backupVault,
  getBackupPath,
  listBackups,
  pruneBackups,
  restoreBackup,
} from "./vaultBackup";

function makeTempVault(dir: string, name = "test.vault.json"): string {
  const vaultPath = path.join(dir, name);
  fs.writeFileSync(vaultPath, JSON.stringify({ secrets: {}, publicKey: "pk" }));
  return vaultPath;
}

describe("getBackupPath", () => {
  it("generates a path with timestamp", () => {
    const ts = new Date("2024-01-15T10:30:00.000Z");
    const result = getBackupPath("/tmp/test.vault.json", ts);
    expect(result).toContain("test.vault.");
    expect(result).toContain(".bak.json");
    expect(result).toContain("2024-01-15T10-30-00-000Z");
  });
});

describe("backupVault", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-backup-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates a backup file", () => {
    const vaultPath = makeTempVault(tmpDir);
    const meta = backupVault(vaultPath);
    expect(fs.existsSync(meta.backupFile)).toBe(true);
    expect(meta.vaultFile).toBe(vaultPath);
  });

  it("throws if vault file does not exist", () => {
    expect(() => backupVault("/nonexistent/test.vault.json")).toThrow(
      "Vault file not found"
    );
  });

  it("backup content matches original", () => {
    const vaultPath = makeTempVault(tmpDir);
    const meta = backupVault(vaultPath);
    const original = fs.readFileSync(vaultPath, "utf-8");
    const backup = fs.readFileSync(meta.backupFile, "utf-8");
    expect(backup).toBe(original);
  });
});

describe("listBackups and pruneBackups", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-prune-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("lists all backup files", () => {
    const vaultPath = makeTempVault(tmpDir);
    backupVault(vaultPath, new Date("2024-01-01T00:00:00.000Z"));
    backupVault(vaultPath, new Date("2024-01-02T00:00:00.000Z"));
    const backups = listBackups(vaultPath);
    expect(backups.length).toBe(2);
  });

  it("prunes old backups keeping only N", () => {
    const vaultPath = makeTempVault(tmpDir);
    for (let i = 1; i <= 4; i++) {
      backupVault(vaultPath, new Date(`2024-01-0${i}T00:00:00.000Z`));
    }
    const deleted = pruneBackups(vaultPath, 2);
    expect(deleted.length).toBe(2);
    expect(listBackups(vaultPath).length).toBe(2);
  });
});

describe("restoreBackup", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-restore-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("restores vault from backup", () => {
    const vaultPath = makeTempVault(tmpDir);
    const meta = backupVault(vaultPath);
    fs.writeFileSync(vaultPath, JSON.stringify({ secrets: {}, publicKey: "modified" }));
    restoreBackup(meta.backupFile, vaultPath);
    const restored = JSON.parse(fs.readFileSync(vaultPath, "utf-8"));
    expect(restored.publicKey).toBe("pk");
  });

  it("throws if backup file does not exist", () => {
    const vaultPath = makeTempVault(tmpDir);
    expect(() => restoreBackup("/nonexistent.bak.json", vaultPath)).toThrow(
      "Backup file not found"
    );
  });
});
