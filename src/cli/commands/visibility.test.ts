import fs from "fs";
import os from "os";
import path from "path";
import { Command } from "commander";
import { registerVisibilityCommand } from "./visibility";
import { loadVisibilityStore } from "../../vault/vaultVisibility";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-vis-cmd-"));
}

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerVisibilityCommand(program);
  return program;
}

describe("visibility command", () => {
  it("set stores the visibility level", () => {
    const dir = makeTempDir();
    const program = buildProgram();
    program.parse(["node", "test", "visibility", "set", "API_KEY", "secret", "--vault-dir", dir]);
    const store = loadVisibilityStore(dir);
    expect(store["API_KEY"]).toBe("secret");
  });

  it("set rejects invalid level", () => {
    const dir = makeTempDir();
    const program = buildProgram();
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    expect(() =>
      program.parse(["node", "test", "visibility", "set", "KEY", "invisible", "--vault-dir", dir])
    ).toThrow();
    mockExit.mockRestore();
  });

  it("get prints the visibility level", () => {
    const dir = makeTempDir();
    const program = buildProgram();
    program.parse(["node", "test", "visibility", "set", "DB_URL", "public", "--vault-dir", dir]);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "test", "visibility", "get", "DB_URL", "--vault-dir", dir]);
    expect(consoleSpy).toHaveBeenCalledWith("DB_URL: public");
    consoleSpy.mockRestore();
  });

  it("remove deletes the key override", () => {
    const dir = makeTempDir();
    const program = buildProgram();
    program.parse(["node", "test", "visibility", "set", "TOKEN", "secret", "--vault-dir", dir]);
    program.parse(["node", "test", "visibility", "remove", "TOKEN", "--vault-dir", dir]);
    const store = loadVisibilityStore(dir);
    expect(store["TOKEN"]).toBeUndefined();
  });

  it("list shows all overrides", () => {
    const dir = makeTempDir();
    const program = buildProgram();
    program.parse(["node", "test", "visibility", "set", "A", "public", "--vault-dir", dir]);
    program.parse(["node", "test", "visibility", "set", "B", "secret", "--vault-dir", dir]);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "test", "visibility", "list", "--vault-dir", dir]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("A"));
    consoleSpy.mockRestore();
  });

  it("list filtered by level", () => {
    const dir = makeTempDir();
    const program = buildProgram();
    program.parse(["node", "test", "visibility", "set", "X", "public", "--vault-dir", dir]);
    program.parse(["node", "test", "visibility", "set", "Y", "secret", "--vault-dir", dir]);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "test", "visibility", "list", "public", "--vault-dir", dir]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("X"));
    consoleSpy.mockRestore();
  });
});
