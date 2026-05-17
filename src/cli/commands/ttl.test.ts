import { Command } from "commander";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { registerTTLCommand } from "./ttl";
import { setTTL, loadTTLStore } from "../../vault/vaultTTL";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-ttl-cli-"));
}

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerTTLCommand(program);
  return program;
}

describe("ttl command", () => {
  let tmpDir: string;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    tmpDir = makeTempDir();
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it("sets a TTL for a key", () => {
    const program = buildProgram();
    program.parse(["node", "test", "ttl", "set", "MY_KEY", "3600", "-d", tmpDir]);
    const store = loadTTLStore(tmpDir);
    expect(store["MY_KEY"]).toBeDefined();
    expect(store["MY_KEY"].ttlSeconds).toBe(3600);
  });

  it("gets a TTL entry for a key", () => {
    setTTL(tmpDir, "API_TOKEN", 1800);
    const program = buildProgram();
    program.parse(["node", "test", "ttl", "get", "API_TOKEN", "-d", tmpDir]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("API_TOKEN"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("1800s"));
  });

  it("reports no TTL for missing key", () => {
    const program = buildProgram();
    program.parse(["node", "test", "ttl", "get", "MISSING", "-d", tmpDir]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No TTL set for "MISSING"'));
  });

  it("removes a TTL entry", () => {
    setTTL(tmpDir, "DB_PASS", 600);
    const program = buildProgram();
    program.parse(["node", "test", "ttl", "remove", "DB_PASS", "-d", tmpDir]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('TTL removed for "DB_PASS"'));
    const store = loadTTLStore(tmpDir);
    expect(store["DB_PASS"]).toBeUndefined();
  });

  it("lists all TTL entries", () => {
    setTTL(tmpDir, "KEY_A", 300);
    setTTL(tmpDir, "KEY_B", 600);
    const program = buildProgram();
    program.parse(["node", "test", "ttl", "list", "-d", tmpDir]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("KEY_A"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("KEY_B"));
  });

  it("lists only expired keys with --expired flag", () => {
    const past = new Date(Date.now() - 20000).toISOString();
    const { saveTTLStore } = require("../../vault/vaultTTL");
    saveTTLStore(tmpDir, {
      OLD: { key: "OLD", ttlSeconds: 1, createdAt: past },
      FRESH: { key: "FRESH", ttlSeconds: 99999, createdAt: new Date().toISOString() },
    });
    const program = buildProgram();
    program.parse(["node", "test", "ttl", "list", "--expired", "-d", tmpDir]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("OLD"));
    const calls = consoleSpy.mock.calls.flat().join(" ");
    expect(calls).not.toContain("FRESH");
  });
});
