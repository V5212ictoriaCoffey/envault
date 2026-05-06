import { Command } from "commander";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { registerTemplateCommand } from "./template";
import { loadTemplate } from "../../vault/vaultTemplate";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-tmpl-cmd-"));
}

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerTemplateCommand(program);
  return program;
}

describe("template init", () => {
  it("creates template from .env file", () => {
    const dir = makeTempDir();
    const envPath = path.join(dir, ".env");
    fs.writeFileSync(envPath, "API_KEY=secret\nDB_URL=postgres://localhost\n");
    const program = buildProgram();
    program.parse(["node", "test", "template", "init", "my-app", "--env", envPath, "--vault-dir", dir]);
    const tmpl = loadTemplate(dir);
    expect(tmpl).not.toBeNull();
    expect(tmpl!.name).toBe("my-app");
    expect(tmpl!.keys.map((k) => k.key)).toContain("API_KEY");
  });

  it("exits if .env file not found", () => {
    const dir = makeTempDir();
    const program = buildProgram();
    expect(() =>
      program.parse(["node", "test", "template", "init", "my-app", "--env", path.join(dir, "missing.env"), "--vault-dir", dir])
    ).toThrow();
  });
});

describe("template show", () => {
  it("prints message when no template exists", () => {
    const dir = makeTempDir();
    const program = buildProgram();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "test", "template", "show", "--vault-dir", dir]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("No template found"));
    spy.mockRestore();
  });

  it("prints template info when template exists", () => {
    const dir = makeTempDir();
    const envPath = path.join(dir, ".env");
    fs.writeFileSync(envPath, "PORT=3000\n");
    const prog1 = buildProgram();
    prog1.parse(["node", "test", "template", "init", "show-test", "--env", envPath, "--vault-dir", dir]);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const prog2 = buildProgram();
    prog2.parse(["node", "test", "template", "show", "--vault-dir", dir]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("show-test"));
    spy.mockRestore();
  });
});

describe("template scaffold", () => {
  it("writes scaffold file from template", () => {
    const dir = makeTempDir();
    const envPath = path.join(dir, ".env");
    const outputPath = path.join(dir, ".env.example");
    fs.writeFileSync(envPath, "SECRET=abc\n");
    const prog1 = buildProgram();
    prog1.parse(["node", "test", "template", "init", "scaffold-test", "--env", envPath, "--vault-dir", dir]);
    const prog2 = buildProgram();
    prog2.parse(["node", "test", "template", "scaffold", "--vault-dir", dir, "--output", outputPath]);
    const content = fs.readFileSync(outputPath, "utf-8");
    expect(content).toContain("SECRET=");
  });
});
