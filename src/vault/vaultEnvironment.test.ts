import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  getEnvironmentPath,
  loadEnvironmentStore,
  saveEnvironmentStore,
  addKeyToEnvironment,
  removeKeyFromEnvironment,
  deleteEnvironment,
  listEnvironments,
  getKeysForEnvironment,
} from "./vaultEnvironment";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-env-test-"));
}

describe("vaultEnvironment", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("getEnvironmentPath returns correct path", () => {
    expect(getEnvironmentPath(tmpDir)).toBe(
      path.join(tmpDir, ".envault-environments.json")
    );
  });

  test("loadEnvironmentStore returns empty store if no file", () => {
    const store = loadEnvironmentStore(tmpDir);
    expect(store).toEqual({ environments: {} });
  });

  test("saveEnvironmentStore and loadEnvironmentStore round-trip", () => {
    const store = { environments: { production: ["DB_URL", "API_KEY"] } };
    saveEnvironmentStore(tmpDir, store);
    const loaded = loadEnvironmentStore(tmpDir);
    expect(loaded).toEqual(store);
  });

  test("addKeyToEnvironment creates env and adds key", () => {
    addKeyToEnvironment(tmpDir, "staging", "DB_URL");
    const keys = getKeysForEnvironment(tmpDir, "staging");
    expect(keys).toContain("DB_URL");
  });

  test("addKeyToEnvironment does not duplicate keys", () => {
    addKeyToEnvironment(tmpDir, "staging", "DB_URL");
    addKeyToEnvironment(tmpDir, "staging", "DB_URL");
    const keys = getKeysForEnvironment(tmpDir, "staging");
    expect(keys.filter((k) => k === "DB_URL").length).toBe(1);
  });

  test("removeKeyFromEnvironment removes a key", () => {
    addKeyToEnvironment(tmpDir, "staging", "DB_URL");
    addKeyToEnvironment(tmpDir, "staging", "API_KEY");
    removeKeyFromEnvironment(tmpDir, "staging", "DB_URL");
    const keys = getKeysForEnvironment(tmpDir, "staging");
    expect(keys).not.toContain("DB_URL");
    expect(keys).toContain("API_KEY");
  });

  test("removeKeyFromEnvironment deletes env if empty", () => {
    addKeyToEnvironment(tmpDir, "staging", "DB_URL");
    removeKeyFromEnvironment(tmpDir, "staging", "DB_URL");
    const envs = listEnvironments(tmpDir);
    expect(envs).not.toContain("staging");
  });

  test("deleteEnvironment removes the environment", () => {
    addKeyToEnvironment(tmpDir, "production", "SECRET");
    deleteEnvironment(tmpDir, "production");
    expect(listEnvironments(tmpDir)).not.toContain("production");
  });

  test("listEnvironments returns all environment names", () => {
    addKeyToEnvironment(tmpDir, "dev", "KEY1");
    addKeyToEnvironment(tmpDir, "prod", "KEY2");
    const envs = listEnvironments(tmpDir);
    expect(envs).toContain("dev");
    expect(envs).toContain("prod");
  });

  test("getKeysForEnvironment returns empty array for unknown env", () => {
    const keys = getKeysForEnvironment(tmpDir, "nonexistent");
    expect(keys).toEqual([]);
  });
});
