import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  getOwnerPath,
  loadOwnerStore,
  setOwner,
  removeOwner,
  getOwner,
  listOwners,
  getKeysByOwner,
} from "./vaultOwner";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-owner-"));
}

describe("vaultOwner", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("getOwnerPath returns correct path", () => {
    const p = getOwnerPath(tmpDir);
    expect(p).toContain(".envault-owners.json");
  });

  test("loadOwnerStore returns empty object when file missing", () => {
    const store = loadOwnerStore(tmpDir);
    expect(store).toEqual({});
  });

  test("setOwner creates an owner entry", () => {
    const entry = setOwner(tmpDir, "API_KEY", "alice");
    expect(entry.key).toBe("API_KEY");
    expect(entry.owner).toBe("alice");
    expect(entry.assignedAt).toBeDefined();
  });

  test("getOwner retrieves an existing entry", () => {
    setOwner(tmpDir, "DB_PASS", "bob");
    const entry = getOwner(tmpDir, "DB_PASS");
    expect(entry).toBeDefined();
    expect(entry?.owner).toBe("bob");
  });

  test("getOwner returns undefined for missing key", () => {
    const entry = getOwner(tmpDir, "MISSING_KEY");
    expect(entry).toBeUndefined();
  });

  test("removeOwner deletes an entry and returns true", () => {
    setOwner(tmpDir, "SECRET", "carol");
    const result = removeOwner(tmpDir, "SECRET");
    expect(result).toBe(true);
    expect(getOwner(tmpDir, "SECRET")).toBeUndefined();
  });

  test("removeOwner returns false for non-existent key", () => {
    const result = removeOwner(tmpDir, "GHOST");
    expect(result).toBe(false);
  });

  test("listOwners returns all entries", () => {
    setOwner(tmpDir, "KEY_A", "alice");
    setOwner(tmpDir, "KEY_B", "bob");
    const entries = listOwners(tmpDir);
    expect(entries).toHaveLength(2);
  });

  test("getKeysByOwner filters by owner", () => {
    setOwner(tmpDir, "KEY_A", "alice");
    setOwner(tmpDir, "KEY_B", "bob");
    setOwner(tmpDir, "KEY_C", "alice");
    const aliceKeys = getKeysByOwner(tmpDir, "alice");
    expect(aliceKeys).toHaveLength(2);
    expect(aliceKeys).toContain("KEY_A");
    expect(aliceKeys).toContain("KEY_C");
  });
});
