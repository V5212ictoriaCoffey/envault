import fs from "fs";
import os from "os";
import path from "path";
import {
  getCommentPath,
  loadCommentStore,
  setComment,
  removeComment,
  getComment,
  listComments,
} from "./vaultComment";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-comment-test-"));
}

describe("vaultComment", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("getCommentPath returns correct path", () => {
    const p = getCommentPath(tmpDir);
    expect(p).toBe(path.join(tmpDir, ".envault-comments.json"));
  });

  it("loadCommentStore returns empty object when file does not exist", () => {
    const store = loadCommentStore(tmpDir);
    expect(store).toEqual({});
  });

  it("setComment saves a comment for a key", () => {
    setComment(tmpDir, "API_KEY", "Used for external API access");
    const comment = getComment(tmpDir, "API_KEY");
    expect(comment).toBe("Used for external API access");
  });

  it("setComment overwrites an existing comment", () => {
    setComment(tmpDir, "DB_PASS", "Old comment");
    setComment(tmpDir, "DB_PASS", "New comment");
    expect(getComment(tmpDir, "DB_PASS")).toBe("New comment");
  });

  it("removeComment removes an existing key and returns true", () => {
    setComment(tmpDir, "SECRET", "Some secret");
    const result = removeComment(tmpDir, "SECRET");
    expect(result).toBe(true);
    expect(getComment(tmpDir, "SECRET")).toBeUndefined();
  });

  it("removeComment returns false when key does not exist", () => {
    const result = removeComment(tmpDir, "NONEXISTENT");
    expect(result).toBe(false);
  });

  it("listComments returns all stored comments", () => {
    setComment(tmpDir, "KEY_A", "Comment A");
    setComment(tmpDir, "KEY_B", "Comment B");
    const all = listComments(tmpDir);
    expect(all).toEqual({ KEY_A: "Comment A", KEY_B: "Comment B" });
  });

  it("getComment returns undefined for missing key", () => {
    expect(getComment(tmpDir, "MISSING")).toBeUndefined();
  });
});
