import { Command } from "commander";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { registerHistoryCommand } from "./history";
import { appendHistoryEntry, loadHistoryStore } from "../../vault/vaultHistory";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-history-cmd-"));
}

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerHistoryCommand(program);
  return program;
}

describe("history command", () => {
  it("list shows no history message when empty", () => {
    const dir = makeTempDir();
    const program = buildProgram();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "test", "history", "list", "-d", dir]);
    expect(spy).toHaveBeenCalledWith("No history found.");
    spy.mockRestore();
  });

  it("list shows entries", () => {
    const dir = makeTempDir();
    appendHistoryEntry(dir, "API_KEY", "set", "alice");
    const program = buildProgram();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "test", "history", "list", "-d", dir]);
    expect(spy.mock.calls[0][0]).toContain("API_KEY");
    spy.mockRestore();
  });

  it("list filters by key", () => {
    const dir = makeTempDir();
    appendHistoryEntry(dir, "API_KEY", "set");
    appendHistoryEntry(dir, "DB_URL", "set");
    const program = buildProgram();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "test", "history", "list", "API_KEY", "-d", dir]);
    expect(spy.mock.calls[0][0]).toContain("API_KEY");
    expect(spy.mock.calls[0][0]).not.toContain("DB_URL");
    spy.mockRestore();
  });

  it("add appends a history entry", () => {
    const dir = makeTempDir();
    const program = buildProgram();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "test", "history", "add", "SECRET", "rotate", "-d", dir, "-a", "bob"]);
    const store = loadHistoryStore(dir);
    expect(store.entries).toHaveLength(1);
    expect(store.entries[0].key).toBe("SECRET");
    expect(store.entries[0].action).toBe("rotate");
    expect(store.entries[0].actor).toBe("bob");
    spy.mockRestore();
  });

  it("add rejects invalid action", () => {
    const dir = makeTempDir();
    const program = buildProgram();
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    expect(() =>
      program.parse(["node", "test", "history", "add", "KEY", "invalid", "-d", dir])
    ).toThrow("exit");
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it("clear removes all entries", () => {
    const dir = makeTempDir();
    appendHistoryEntry(dir, "API_KEY", "set");
    const program = buildProgram();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "test", "history", "clear", "-d", dir]);
    const store = loadHistoryStore(dir);
    expect(store.entries).toHaveLength(0);
    spy.mockRestore();
  });
});
