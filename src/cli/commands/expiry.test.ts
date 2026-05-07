import { Command } from "commander";
import fs from "fs";
import os from "os";
import path from "path";
import { registerExpiryCommand } from "./expiry";
import { loadExpiryStore } from "../../vault/vaultExpiry";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-expiry-cmd-"));
}

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerExpiryCommand(program);
  return program;
}

describe("expiry command", () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true });
  });

  it("set: stores expiry for a key", () => {
    const program = buildProgram();
    program.parse(["expiry", "set", "API_KEY", "2099-06-01", "--vault-dir", dir], { from: "user" });
    const store = loadExpiryStore(dir);
    expect(store["API_KEY"]).toBeDefined();
    expect(new Date(store["API_KEY"]).getFullYear()).toBe(2099);
  });

  it("set: exits on invalid date", () => {
    const program = buildProgram();
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    expect(() =>
      program.parse(["expiry", "set", "KEY", "not-a-date", "--vault-dir", dir], { from: "user" })
    ).toThrow();
    mockExit.mockRestore();
  });

  it("remove: deletes expiry entry", () => {
    const program = buildProgram();
    program.parse(["expiry", "set", "DB_PASS", "2099-01-01", "--vault-dir", dir], { from: "user" });
    program.parse(["expiry", "remove", "DB_PASS", "--vault-dir", dir], { from: "user" });
    const store = loadExpiryStore(dir);
    expect(store["DB_PASS"]).toBeUndefined();
  });

  it("list: prints no entries message when empty", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const program = buildProgram();
    program.parse(["expiry", "list", "--vault-dir", dir], { from: "user" });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("No expiry"));
    spy.mockRestore();
  });

  it("list: shows entries with status", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const program = buildProgram();
    program.parse(["expiry", "set", "FUTURE_KEY", "2099-01-01", "--vault-dir", dir], { from: "user" });
    program.parse(["expiry", "list", "--vault-dir", dir], { from: "user" });
    const output = spy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("FUTURE_KEY");
    expect(output).toContain("[active]");
    spy.mockRestore();
  });

  it("check: exits 1 when expired keys exist", () => {
    const program = buildProgram();
    program.parse(["expiry", "set", "OLD_KEY", "2000-01-01", "--vault-dir", dir], { from: "user" });
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit:1"); });
    expect(() =>
      program.parse(["expiry", "check", "--vault-dir", dir], { from: "user" })
    ).toThrow("exit:1");
    mockExit.mockRestore();
  });

  it("check: succeeds when no expired keys", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const program = buildProgram();
    program.parse(["expiry", "set", "FRESH", "2099-01-01", "--vault-dir", dir], { from: "user" });
    expect(() =>
      program.parse(["expiry", "check", "--vault-dir", dir], { from: "user" })
    ).not.toThrow();
    spy.mockRestore();
  });
});
