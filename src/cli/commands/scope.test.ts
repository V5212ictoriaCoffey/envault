import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Command } from "commander";
import { registerScopeCommand } from "./scope";
import { setScope } from "../../vault/vaultScope";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-scope-cmd-"));
}

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerScopeCommand(program);
  return program;
}

describe("scope command", () => {
  let tmpDir: string;
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    tmpDir = makeTempDir();
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test("scope set assigns level", () => {
    const program = buildProgram();
    program.parse(["node", "test", "scope", "set", "API_KEY", "shared", "-d", tmpDir]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("shared"));
  });

  test("scope set rejects invalid level", () => {
    const program = buildProgram();
    expect(() =>
      program.parse(["node", "test", "scope", "set", "API_KEY", "invalid", "-d", tmpDir])
    ).toThrow();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid scope level"));
  });

  test("scope get returns level", () => {
    setScope(tmpDir, "DB_PASS", "local");
    const program = buildProgram();
    program.parse(["node", "test", "scope", "get", "DB_PASS", "-d", tmpDir]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("local"));
  });

  test("scope get reports missing key", () => {
    const program = buildProgram();
    program.parse(["node", "test", "scope", "get", "MISSING", "-d", tmpDir]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("No scope"));
  });

  test("scope remove deletes entry", () => {
    setScope(tmpDir, "TOKEN", "global");
    const program = buildProgram();
    program.parse(["node", "test", "scope", "remove", "TOKEN", "-d", tmpDir]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("removed"));
  });

  test("scope list shows all entries", () => {
    setScope(tmpDir, "X", "shared");
    setScope(tmpDir, "Y", "global");
    const program = buildProgram();
    program.parse(["node", "test", "scope", "list", "-d", tmpDir]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("X: shared"));
  });

  test("scope list filters by level", () => {
    setScope(tmpDir, "A", "local");
    setScope(tmpDir, "B", "global");
    const program = buildProgram();
    program.parse(["node", "test", "scope", "list", "-d", tmpDir, "-l", "local"]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("A"));
  });
});
