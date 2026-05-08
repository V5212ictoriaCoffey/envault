import { Command } from "commander";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { registerDeprecateCommand } from "./deprecate";
import { deprecateKey } from "../../vault/vaultDeprecate";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-deprecate-cmd-"));
}

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerDeprecateCommand(program);
  return program;
}

describe("deprecate command", () => {
  it("mark: deprecates a key", () => {
    const dir = makeTempDir();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    buildProgram().parse(["node", "test", "deprecate", "mark", "OLD_KEY", "--dir", dir]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("marked as deprecated"));
    spy.mockRestore();
  });

  it("mark: reports already deprecated", () => {
    const dir = makeTempDir();
    deprecateKey(dir, "OLD_KEY");
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    buildProgram().parse(["node", "test", "deprecate", "mark", "OLD_KEY", "--dir", dir]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("already deprecated"));
    spy.mockRestore();
  });

  it("mark: includes reason and replacedBy", () => {
    const dir = makeTempDir();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    buildProgram().parse([
      "node", "test", "deprecate", "mark", "X",
      "--reason", "old", "--replaced-by", "Y", "--dir", dir,
    ]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("old"));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Y"));
    spy.mockRestore();
  });

  it("unmark: removes deprecation", () => {
    const dir = makeTempDir();
    deprecateKey(dir, "KEY");
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    buildProgram().parse(["node", "test", "deprecate", "unmark", "KEY", "--dir", dir]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("removed"));
    spy.mockRestore();
  });

  it("unmark: reports not deprecated", () => {
    const dir = makeTempDir();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    buildProgram().parse(["node", "test", "deprecate", "unmark", "MISSING", "--dir", dir]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("not deprecated"));
    spy.mockRestore();
  });

  it("list: shows no deprecated keys message", () => {
    const dir = makeTempDir();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    buildProgram().parse(["node", "test", "deprecate", "list", "--dir", dir]);
    expect(spy).toHaveBeenCalledWith("No deprecated keys.");
    spy.mockRestore();
  });

  it("list: shows deprecated keys", () => {
    const dir = makeTempDir();
    deprecateKey(dir, "A", "reason A");
    deprecateKey(dir, "B");
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    buildProgram().parse(["node", "test", "deprecate", "list", "--dir", dir]);
    const output = spy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("A");
    expect(output).toContain("reason A");
    spy.mockRestore();
  });
});
