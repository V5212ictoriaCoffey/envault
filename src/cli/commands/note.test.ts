import fs from "fs";
import os from "os";
import path from "path";
import { Command } from "commander";
import { registerNoteCommand } from "./note";
import { setNote } from "../../vault/vaultNote";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-note-cmd-test-"));
}

function buildProgram(dir: string): Command {
  const program = new Command();
  program.exitOverride();
  registerNoteCommand(program);
  return program;
}

describe("note command", () => {
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

  it("note set adds a note", async () => {
    const program = buildProgram(dir);
    await program.parseAsync(["node", "test", "note", "set", "DB_URL", "main db", "--dir", dir]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Note set"));
  });

  it("note get shows an existing note", async () => {
    setNote(dir, "API_KEY", "third-party key");
    const program = buildProgram(dir);
    await program.parseAsync(["node", "test", "note", "get", "API_KEY", "--dir", dir]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("third-party key"));
  });

  it("note get reports missing note", async () => {
    const program = buildProgram(dir);
    await program.parseAsync(["node", "test", "note", "get", "MISSING", "--dir", dir]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("No note found"));
  });

  it("note remove deletes a note", async () => {
    setNote(dir, "SECRET", "some note");
    const program = buildProgram(dir);
    await program.parseAsync(["node", "test", "note", "remove", "SECRET", "--dir", dir]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Note removed"));
  });

  it("note list shows all notes", async () => {
    setNote(dir, "KEY_A", "alpha");
    setNote(dir, "KEY_B", "beta");
    const program = buildProgram(dir);
    await program.parseAsync(["node", "test", "note", "list", "--dir", dir]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("KEY_A"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("KEY_B"));
  });

  it("note list shows message when empty", async () => {
    const program = buildProgram(dir);
    await program.parseAsync(["node", "test", "note", "list", "--dir", dir]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("No notes found"));
  });
});
