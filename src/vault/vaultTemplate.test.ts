import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  buildTemplateFromEnvFile,
  generateEnvScaffold,
  getTemplatePath,
  loadTemplate,
  saveTemplate,
  VaultTemplate,
} from "./vaultTemplate";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-template-"));
}

describe("getTemplatePath", () => {
  it("returns correct path", () => {
    expect(getTemplatePath("/some/dir")).toBe("/some/dir/.vault-template.json");
  });
});

describe("saveTemplate / loadTemplate", () => {
  it("round-trips a template", () => {
    const dir = makeTempDir();
    const template: VaultTemplate = {
      name: "test-template",
      description: "A test template",
      keys: [{ key: "API_KEY", required: true, example: "<api_key>" }],
      createdAt: new Date().toISOString(),
    };
    saveTemplate(dir, template);
    const loaded = loadTemplate(dir);
    expect(loaded).not.toBeNull();
    expect(loaded!.name).toBe("test-template");
    expect(loaded!.keys).toHaveLength(1);
    expect(loaded!.keys[0].key).toBe("API_KEY");
  });

  it("returns null when no template exists", () => {
    const dir = makeTempDir();
    expect(loadTemplate(dir)).toBeNull();
  });
});

describe("buildTemplateFromEnvFile", () => {
  it("builds template keys from env file", () => {
    const dir = makeTempDir();
    const envPath = path.join(dir, ".env");
    fs.writeFileSync(envPath, "DB_URL=postgres://localhost\nSECRET=abc123\n");
    const template = buildTemplateFromEnvFile(envPath, "my-app");
    expect(template.name).toBe("my-app");
    expect(template.keys.map((k) => k.key)).toContain("DB_URL");
    expect(template.keys.map((k) => k.key)).toContain("SECRET");
    expect(template.keys.every((k) => k.required)).toBe(true);
  });
});

describe("generateEnvScaffold", () => {
  it("generates commented scaffold", () => {
    const template: VaultTemplate = {
      name: "scaffold-test",
      description: "Scaffold description",
      keys: [
        { key: "PORT", required: true, description: "Server port", defaultValue: "3000" },
        { key: "API_KEY", required: true, example: "<api_key>" },
      ],
      createdAt: new Date().toISOString(),
    };
    const scaffold = generateEnvScaffold(template);
    expect(scaffold).toContain("PORT=3000");
    expect(scaffold).toContain("API_KEY=");
    expect(scaffold).toContain("# Server port");
    expect(scaffold).toContain("# Scaffold description");
    expect(scaffold).toContain("# Required");
  });
});
