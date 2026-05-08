import fs from "fs";
import os from "os";
import path from "path";
import { Command } from "commander";
import { registerGroupCommand } from "./group";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-group-cmd-"));
}

function buildProgram(vaultDir: string): Command {
  const program = new Command();
  program.exitOverride();
  registerGroupCommand(program);
  return program;
}

describe("group command", () => {
  let dir: string;
  let program: Command;
  let logs: string[];
  let errors: string[];

  beforeEach(() => {
    dir = makeTempDir();
    program = buildProgram(dir);
    logs = [];
    errors = [];
    jest.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));
    jest.spyOn(console, "error").mockImplementation((msg) => errors.push(msg));
    jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("creates a group", async () => {
    await program.parseAsync(["node", "test", "group", "create", "backend", "--vault-dir", dir]);
    expect(logs.some((l) => l.includes("created"))).toBe(true);
  });

  it("errors when creating duplicate group", async () => {
    await program.parseAsync(["node", "test", "group", "create", "backend", "--vault-dir", dir]);
    await expect(
      program.parseAsync(["node", "test", "group", "create", "backend", "--vault-dir", dir])
    ).rejects.toThrow();
    expect(errors.some((e) => e.includes("already exists"))).toBe(true);
  });

  it("adds a key to a group", async () => {
    await program.parseAsync(["node", "test", "group", "create", "backend", "--vault-dir", dir]);
    await program.parseAsync(["node", "test", "group", "add", "backend", "DB_URL", "--vault-dir", dir]);
    expect(logs.some((l) => l.includes("DB_URL"))).toBe(true);
  });

  it("shows keys in a group", async () => {
    await program.parseAsync(["node", "test", "group", "create", "backend", "--vault-dir", dir]);
    await program.parseAsync(["node", "test", "group", "add", "backend", "DB_URL", "--vault-dir", dir]);
    await program.parseAsync(["node", "test", "group", "show", "backend", "--vault-dir", dir]);
    expect(logs.some((l) => l.includes("DB_URL"))).toBe(true);
  });

  it("lists groups", async () => {
    await program.parseAsync(["node", "test", "group", "create", "backend", "--vault-dir", dir]);
    await program.parseAsync(["node", "test", "group", "list", "--vault-dir", dir]);
    expect(logs.some((l) => l.includes("backend"))).toBe(true);
  });

  it("deletes a group", async () => {
    await program.parseAsync(["node", "test", "group", "create", "backend", "--vault-dir", dir]);
    await program.parseAsync(["node", "test", "group", "delete", "backend", "--vault-dir", dir]);
    expect(logs.some((l) => l.includes("deleted"))).toBe(true);
  });
});
