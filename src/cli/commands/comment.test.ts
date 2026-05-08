import { Command } from "commander";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { registerCommentCommand } from "./comment";
import { saveCommentStore } from "../../vault/vaultComment";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-comment-test-"));
}

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerCommentCommand(program);
  return program;
}

describe("comment command", () => {
  let tmpDir: string;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    tmpDir = makeTempDir();
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("sets a comment for a key", async () => {
    const program = buildProgram();
    await program.parseAsync(["comment", "set", "API_KEY", "Main API key", "-d", tmpDir], { from: "user" });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Comment set for \"API_KEY\""));
  });

  it("gets a comment for a key", async () => {
    saveCommentStore(tmpDir, { comments: { DB_URL: "Primary database URL" } });
    const program = buildProgram();
    await program.parseAsync(["comment", "get", "DB_URL", "-d", tmpDir], { from: "user" });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Primary database URL"));
  });

  it("reports missing comment on get", async () => {
    const program = buildProgram();
    await program.parseAsync(["comment", "get", "MISSING_KEY", "-d", tmpDir], { from: "user" });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("No comment found"));
  });

  it("removes a comment", async () => {
    saveCommentStore(tmpDir, { comments: { SECRET: "old comment" } });
    const program = buildProgram();
    await program.parseAsync(["comment", "remove", "SECRET", "-d", tmpDir], { from: "user" });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Comment removed for \"SECRET\""));
  });

  it("lists all comments", async () => {
    saveCommentStore(tmpDir, { comments: { FOO: "foo comment", BAR: "bar comment" } });
    const program = buildProgram();
    await program.parseAsync(["comment", "list", "-d", tmpDir], { from: "user" });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("FOO"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("BAR"));
  });

  it("lists empty comments gracefully", async () => {
    const program = buildProgram();
    await program.parseAsync(["comment", "list", "-d", tmpDir], { from: "user" });
    expect(consoleSpy).toHaveBeenCalledWith("No comments found.");
  });
});
