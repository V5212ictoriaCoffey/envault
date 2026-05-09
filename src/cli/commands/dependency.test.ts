import fs from "fs";
import os from "os";
import path from "path";
import { Command } from "commander";
import { registerDependencyCommand } from "./dependency";
import { addDependency, getDependencies } from "../../vault/vaultDependency";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-dep-cli-"));
}

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerDependencyCommand(program);
  return program;
}

describe("dependency command", () => {
  let dir: string;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    dir = makeTempDir();
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    consoleSpy.mockRestore();
  });

  it("adds a dependency", () => {
    const program = buildProgram();
    program.parse(["node", "test", "dependency", "add", "DB_URL", "DB_HOST", "--dir", dir]);
    expect(getDependencies(dir, "DB_URL")).toContain("DB_HOST");
    expect(consoleSpy).toHaveBeenCalledWith("Added dependency: DB_URL → DB_HOST");
  });

  it("removes a dependency", () => {
    addDependency(dir, "DB_URL", "DB_HOST");
    const program = buildProgram();
    program.parse(["node", "test", "dependency", "remove", "DB_URL", "DB_HOST", "--dir", dir]);
    expect(getDependencies(dir, "DB_URL")).not.toContain("DB_HOST");
  });

  it("lists dependencies", () => {
    addDependency(dir, "DB_URL", "DB_HOST");
    addDependency(dir, "DB_URL", "DB_PORT");
    const program = buildProgram();
    program.parse(["node", "test", "dependency", "list", "DB_URL", "--dir", dir]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("DB_HOST"));
  });

  it("shows message when no dependencies", () => {
    const program = buildProgram();
    program.parse(["node", "test", "dependency", "list", "MISSING_KEY", "--dir", dir]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("No dependencies"));
  });

  it("lists dependents", () => {
    addDependency(dir, "DB_URL", "DB_HOST");
    const program = buildProgram();
    program.parse(["node", "test", "dependency", "dependents", "DB_HOST", "--dir", dir]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("DB_URL"));
  });

  it("clears all dependencies", () => {
    addDependency(dir, "DB_URL", "DB_HOST");
    const program = buildProgram();
    program.parse(["node", "test", "dependency", "clear", "DB_URL", "--dir", dir]);
    expect(getDependencies(dir, "DB_URL")).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Cleared"));
  });
});
