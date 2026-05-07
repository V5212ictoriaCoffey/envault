import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  createEnvProfile,
  deleteEnvProfile,
  getEnvProfile,
  listEnvProfiles,
  loadEnvProfileStore,
  updateEnvProfileKeys,
} from "./vaultEnvProfile";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-profile-test-"));
}

describe("vaultEnvProfile", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns empty store when no file exists", () => {
    const store = loadEnvProfileStore(tmpDir);
    expect(store.profiles).toEqual({});
  });

  it("creates a profile and persists it", () => {
    const profile = createEnvProfile(tmpDir, "production", ["DB_URL", "API_KEY"], "Prod vars");
    expect(profile.name).toBe("production");
    expect(profile.keys).toEqual(["DB_URL", "API_KEY"]);
    expect(profile.description).toBe("Prod vars");
    expect(profile.createdAt).toBeTruthy();
  });

  it("retrieves a created profile by name", () => {
    createEnvProfile(tmpDir, "staging", ["DB_URL"]);
    const profile = getEnvProfile(tmpDir, "staging");
    expect(profile).toBeDefined();
    expect(profile?.name).toBe("staging");
  });

  it("returns undefined for non-existent profile", () => {
    const profile = getEnvProfile(tmpDir, "ghost");
    expect(profile).toBeUndefined();
  });

  it("lists all profiles", () => {
    createEnvProfile(tmpDir, "dev", ["DEBUG"]);
    createEnvProfile(tmpDir, "prod", ["API_KEY"]);
    const profiles = listEnvProfiles(tmpDir);
    expect(profiles).toHaveLength(2);
    expect(profiles.map((p) => p.name)).toContain("dev");
    expect(profiles.map((p) => p.name)).toContain("prod");
  });

  it("deletes a profile", () => {
    createEnvProfile(tmpDir, "temp", ["TMP_VAR"]);
    const result = deleteEnvProfile(tmpDir, "temp");
    expect(result).toBe(true);
    expect(getEnvProfile(tmpDir, "temp")).toBeUndefined();
  });

  it("returns false when deleting non-existent profile", () => {
    const result = deleteEnvProfile(tmpDir, "nonexistent");
    expect(result).toBe(false);
  });

  it("updates profile keys and updatedAt", async () => {
    createEnvProfile(tmpDir, "dev", ["OLD_KEY"]);
    await new Promise((r) => setTimeout(r, 10));
    const updated = updateEnvProfileKeys(tmpDir, "dev", ["NEW_KEY", "ANOTHER_KEY"]);
    expect(updated?.keys).toEqual(["NEW_KEY", "ANOTHER_KEY"]);
    expect(updated?.updatedAt).not.toBe(updated?.createdAt);
  });

  it("returns undefined when updating non-existent profile", () => {
    const result = updateEnvProfileKeys(tmpDir, "ghost", ["KEY"]);
    expect(result).toBeUndefined();
  });
});
