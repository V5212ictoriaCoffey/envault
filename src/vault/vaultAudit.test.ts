import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  appendAuditEntry,
  formatAuditLog,
  getAuditPath,
  loadAuditLog,
  saveAuditLog,
} from "./vaultAudit";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-audit-test-"));
}

describe("vaultAudit", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("getAuditPath returns correct path", () => {
    const p = getAuditPath(tmpDir);
    expect(p).toContain(".envault-audit.json");
    expect(p).toContain(tmpDir);
  });

  it("loadAuditLog returns empty log when file does not exist", () => {
    const log = loadAuditLog(tmpDir);
    expect(log.entries).toEqual([]);
  });

  it("saveAuditLog and loadAuditLog round-trip", () => {
    const log = {
      entries: [
        { timestamp: "2024-01-01T00:00:00.000Z", action: "add" as const, key: "API_KEY" },
      ],
    };
    saveAuditLog(log, tmpDir);
    const loaded = loadAuditLog(tmpDir);
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0].key).toBe("API_KEY");
  });

  it("appendAuditEntry adds entry with timestamp", () => {
    appendAuditEntry({ action: "add", key: "DB_URL", actor: "alice" }, tmpDir);
    const log = loadAuditLog(tmpDir);
    expect(log.entries).toHaveLength(1);
    expect(log.entries[0].action).toBe("add");
    expect(log.entries[0].key).toBe("DB_URL");
    expect(log.entries[0].actor).toBe("alice");
    expect(log.entries[0].timestamp).toBeDefined();
  });

  it("appendAuditEntry accumulates multiple entries", () => {
    appendAuditEntry({ action: "add", key: "FOO" }, tmpDir);
    appendAuditEntry({ action: "remove", key: "BAR" }, tmpDir);
    const log = loadAuditLog(tmpDir);
    expect(log.entries).toHaveLength(2);
  });

  it("formatAuditLog returns message when no entries", () => {
    const result = formatAuditLog({ entries: [] });
    expect(result).toBe("No audit entries found.");
  });

  it("formatAuditLog formats entries correctly", () => {
    const log = {
      entries: [
        { timestamp: "2024-06-01T12:00:00.000Z", action: "rotate" as const, actor: "bob", details: "re-encrypted vault" },
      ],
    };
    const result = formatAuditLog(log);
    expect(result).toContain("ROTATE");
    expect(result).toContain("actor=bob");
    expect(result).toContain("re-encrypted vault");
  });
});
