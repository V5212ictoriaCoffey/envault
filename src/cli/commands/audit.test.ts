import { Command } from "commander";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { registerAuditCommand } from "./audit";
import { appendAuditEntry, loadAuditLog, saveAuditLog } from "../../vault/vaultAudit";

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerAuditCommand(program);
  return program;
}

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-audit-cmd-test-"));
}

describe("audit command", () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("audit log shows no entries message when empty", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const program = buildProgram();
    program.parse(["node", "envault", "audit", "log"]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("No audit entries found."));
    spy.mockRestore();
  });

  it("audit log displays entries", () => {
    appendAuditEntry({ action: "add", key: "SECRET", actor: "dev" });
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const program = buildProgram();
    program.parse(["node", "envault", "audit", "log"]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("ADD"));
    spy.mockRestore();
  });

  it("audit log --last limits entries", () => {
    appendAuditEntry({ action: "add", key: "A" });
    appendAuditEntry({ action: "remove", key: "B" });
    appendAuditEntry({ action: "rotate" });
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const program = buildProgram();
    program.parse(["node", "envault", "audit", "log", "--last", "1"]);
    const output: string = spy.mock.calls[0][0];
    expect(output.split("\n")).toHaveLength(1);
    spy.mockRestore();
  });

  it("audit clear requires --confirm", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const program = buildProgram();
    expect(() => program.parse(["node", "envault", "audit", "clear"])).toThrow("exit");
    spy.mockRestore();
    mockExit.mockRestore();
  });

  it("audit clear with --confirm empties the log", () => {
    appendAuditEntry({ action: "add", key: "SECRET", actor: "dev" });
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const program = buildProgram();
    program.parse(["node", "envault", "audit", "clear", "--confirm"]);
    const log = loadAuditLog();
    expect(log.entries).toHaveLength(0);
    spy.mockRestore();
  });

  it("audit record adds entry", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const program = buildProgram();
    program.parse(["node", "envault", "audit", "record", "export", "--actor", "ci", "--details", "nightly build"]);
    const log = loadAuditLog();
    expect(log.entries).toHaveLength(1);
    expect(log.entries[0].action).toBe("export");
    expect(log.entries[0].actor).toBe("ci");
    spy.mockRestore();
  });

  it("audit record rejects invalid action", () => {
    const spy = 
