import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  addTag,
  getTag,
  listTags,
  removeTag,
  getKeysForTag,
  loadTagStore,
  getTagPath,
} from "./vaultTag";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-tag-test-"));
}

describe("vaultTag", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("getTagPath returns correct path", () => {
    expect(getTagPath(tmpDir)).toBe(path.join(tmpDir, ".vault-tags.json"));
  });

  it("loadTagStore returns empty store when file missing", () => {
    const store = loadTagStore(tmpDir);
    expect(store).toEqual({ tags: {} });
  });

  it("addTag creates a new tag with keys", () => {
    const tag = addTag(tmpDir, "production", ["DB_URL", "API_KEY"]);
    expect(tag.name).toBe("production");
    expect(tag.keys).toEqual(["DB_URL", "API_KEY"]);
    expect(tag.createdAt).toBeDefined();
  });

  it("getTag retrieves an existing tag", () => {
    addTag(tmpDir, "staging", ["REDIS_URL"]);
    const tag = getTag(tmpDir, "staging");
    expect(tag).toBeDefined();
    expect(tag?.keys).toContain("REDIS_URL");
  });

  it("getTag returns undefined for missing tag", () => {
    expect(getTag(tmpDir, "nonexistent")).toBeUndefined();
  });

  it("listTags returns all tags", () => {
    addTag(tmpDir, "alpha", ["KEY_A"]);
    addTag(tmpDir, "beta", ["KEY_B"]);
    const tags = listTags(tmpDir);
    expect(tags).toHaveLength(2);
    expect(tags.map((t) => t.name)).toContain("alpha");
    expect(tags.map((t) => t.name)).toContain("beta");
  });

  it("removeTag deletes an existing tag and returns true", () => {
    addTag(tmpDir, "temp", ["TMP_KEY"]);
    const result = removeTag(tmpDir, "temp");
    expect(result).toBe(true);
    expect(getTag(tmpDir, "temp")).toBeUndefined();
  });

  it("removeTag returns false for non-existent tag", () => {
    expect(removeTag(tmpDir, "ghost")).toBe(false);
  });

  it("getKeysForTag returns keys for existing tag", () => {
    addTag(tmpDir, "db", ["DB_HOST", "DB_PASS"]);
    expect(getKeysForTag(tmpDir, "db")).toEqual(["DB_HOST", "DB_PASS"]);
  });

  it("getKeysForTag returns empty array for missing tag", () => {
    expect(getKeysForTag(tmpDir, "missing")).toEqual([]);
  });
});
