import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Command } from "commander";
import { registerRequireCommand } from "./require";
import { requireKey } from "../../vault/vaultRequire";
import { saveVault, createVault } from "../../vault";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-require-cmd-"));
}

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerRequireCommand(program);
  return program;
}

describe("require command", () => {
  it("require add marks a key as required", () => {
    const dir = makeTempDir();
    const program = buildProgram();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "test", "require", "add", "API_KEY", "-d", dir]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("API_KEY"));
    spy.mockRestore();
  });

  it("require remove unmarks a key", () => {
    const dir = makeTempDir();
    requireKey(dir, "API_KEY");
    const program = buildProgram();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "test", "require", "remove", "API_KEY", "-d", dir]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("removed"));
    spy.mockRestore();
  });

  it("require list shows all required keys", () => {
    const dir = makeTempDir();
    requireKey(dir, "DB_URL");
    requireKey(dir, "SECRET");
    const program = buildProgram();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "test", "require", "list", "-d", dir]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("DB_URL"));
    spy.mockRestore();
  });

  it("require list shows message when no keys", () => {
    const dir = makeTempDir();
    const program = buildProgram();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "test", "require", "list", "-d", dir]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("No required"));
    spy.mockRestore();
  });

  it("require check passes when all keys present", () => {
    const dir = makeTempDir();
    const vault = createVault();
    vault.data["API_KEY"] = "enc_value";
    saveVault(dir, vault);
    requireKey(dir, "API_KEY");
    const program = buildProgram();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "test", "require", "check", "-d", dir]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("All required"));
    spy.mockRestore();
  });
});
