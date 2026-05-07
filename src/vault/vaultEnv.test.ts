import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  addEnvProfile,
  getActiveProfile,
  getEnvProfilePath,
  loadEnvProfileStore,
  removeEnvProfile,
  setActiveProfile,
} from "./vaultEnv";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-env-test-"));
}

describe("vaultEnv", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns empty store when no profile file exists", () => {
    const store = loadEnvProfileStore(tmpDir);
    expect(store.profiles).toEqual([]);
    expect(store.active).toBeUndefined();
  });

  it("adds a new profile", () => {
    const store = addEnvProfile(tmpDir, "development", ".envault.dev.json", "Dev env");
    expect(store.profiles).toHaveLength(1);
    expect(store.profiles[0].name).toBe("development");
    expect(store.profiles[0].vaultFile).toBe(".envault.dev.json");
    expect(store.profiles[0].description).toBe("Dev env");
  });

  it("overwrites an existing profile with the same name", () => {
    addEnvProfile(tmpDir, "staging", "old.json");
    const store = addEnvProfile(tmpDir, "staging", "new.json", "Updated");
    expect(store.profiles).toHaveLength(1);
    expect(store.profiles[0].vaultFile).toBe("new.json");
  });

  it("removes a profile by name", () => {
    addEnvProfile(tmpDir, "production", ".envault.prod.json");
    const store = removeEnvProfile(tmpDir, "production");
    expect(store.profiles).toHaveLength(0);
  });

  it("clears active when the active profile is removed", () => {
    addEnvProfile(tmpDir, "staging", ".envault.staging.json");
    setActiveProfile(tmpDir, "staging");
    const store = removeEnvProfile(tmpDir, "staging");
    expect(store.active).toBeUndefined();
  });

  it("sets and retrieves the active profile", () => {
    addEnvProfile(tmpDir, "production", ".envault.prod.json");
    setActiveProfile(tmpDir, "production");
    const active = getActiveProfile(tmpDir);
    expect(active?.name).toBe("production");
  });

  it("throws when setting a non-existent profile as active", () => {
    expect(() => setActiveProfile(tmpDir, "nonexistent")).toThrow(
      'Profile "nonexistent" does not exist.'
    );
  });

  it("returns undefined active profile when none is set", () => {
    addEnvProfile(tmpDir, "development", ".envault.dev.json");
    const active = getActiveProfile(tmpDir);
    expect(active).toBeUndefined();
  });

  it("persists profile store to correct path", () => {
    addEnvProfile(tmpDir, "development", ".envault.dev.json");
    const filePath = getEnvProfilePath(tmpDir);
    expect(fs.existsSync(filePath)).toBe(true);
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    expect(raw.profiles[0].name).toBe("development");
  });
});
