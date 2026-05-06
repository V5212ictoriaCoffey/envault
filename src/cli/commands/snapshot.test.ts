import { Command } from "commander";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { registerSnapshotCommand } from "./snapshot";
import { saveVault } from "../../vault/vault";
import { createSnapshot, listSnapshots } from "../../vault/vaultSnapshot";
import { Vault } from "../../vault/vault";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-snap-cmd-"));
}

function makeVault(keys: string[]): Vault {
  const records: Record<string, string> = {};
  keys.forEach((k) => (records[k] = `enc_${k}`));
  return { version: 1, records, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerSnapshotCommand(program);
  return program;
}

describe("snapshot command", () => {
  it("creates a snapshot via CLI", () => {
    const dir = makeTempDir();
    const vault = makeVault(["KEY1"]);
    saveVault(dir, vault);
    const program = buildProgram();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "test", "snapshot", "create", "my-label", "-d", dir]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("my-label"));
    spy.mockRestore();
  });

  it("lists snapshots via CLI", () => {
    const dir = makeTempDir();
    const vault = makeVault(["A"]);
    saveVault(dir, vault);
    createSnapshot(dir, vault, "snap-one");
    const program = buildProgram();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "test", "snapshot", "list", "-d", dir]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("snap-one"));
    spy.mockRestore();
  });

  it("prints message when no snapshots exist", () => {
    const dir = makeTempDir();
    const program = buildProgram();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "test", "snapshot", "list", "-d", dir]);
    expect(spy).toHaveBeenCalledWith("No snapshots found.");
    spy.mockRestore();
  });

  it("restores vault from snapshot", () => {
    const dir = makeTempDir();
    const vault = makeVault(["RESTORED_KEY"]);
    saveVault(dir, vault);
    const id = createSnapshot(dir, vault, "restore-test");
    const program = buildProgram();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "test", "snapshot", "restore", id, "-d", dir]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("restored"));
    spy.mockRestore();
  });

  it("deletes a snapshot", () => {
    const dir = makeTempDir();
    const vault = makeVault(["X"]);
    const id = createSnapshot(dir, vault, "to-del");
    const program = buildProgram();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "test", "snapshot", "delete", id, "-d", dir]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("deleted"));
    expect(listSnapshots(dir)).toHaveLength(0);
    spy.mockRestore();
  });
});
