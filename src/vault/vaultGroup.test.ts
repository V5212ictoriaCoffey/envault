import fs from "fs";
import os from "os";
import path from "path";
import {
  createGroup,
  deleteGroup,
  addKeyToGroup,
  removeKeyFromGroup,
  listGroups,
  getGroupKeys,
  loadGroupStore,
} from "./vaultGroup";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-group-"));
}

describe("vaultGroup", () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("creates a new group", () => {
    createGroup(dir, "backend");
    const store = loadGroupStore(dir);
    expect(store.groups["backend"]).toEqual([]);
  });

  it("throws if group already exists", () => {
    createGroup(dir, "backend");
    expect(() => createGroup(dir, "backend")).toThrow(/already exists/);
  });

  it("deletes a group", () => {
    createGroup(dir, "backend");
    deleteGroup(dir, "backend");
    expect(listGroups(dir)).not.toContain("backend");
  });

  it("throws when deleting non-existent group", () => {
    expect(() => deleteGroup(dir, "ghost")).toThrow(/not found/);
  });

  it("adds a key to a group", () => {
    createGroup(dir, "backend");
    addKeyToGroup(dir, "backend", "DB_URL");
    expect(getGroupKeys(dir, "backend")).toContain("DB_URL");
  });

  it("does not duplicate keys in a group", () => {
    createGroup(dir, "backend");
    addKeyToGroup(dir, "backend", "DB_URL");
    addKeyToGroup(dir, "backend", "DB_URL");
    expect(getGroupKeys(dir, "backend").filter((k) => k === "DB_URL")).toHaveLength(1);
  });

  it("removes a key from a group", () => {
    createGroup(dir, "backend");
    addKeyToGroup(dir, "backend", "DB_URL");
    removeKeyFromGroup(dir, "backend", "DB_URL");
    expect(getGroupKeys(dir, "backend")).not.toContain("DB_URL");
  });

  it("lists all groups", () => {
    createGroup(dir, "backend");
    createGroup(dir, "frontend");
    expect(listGroups(dir)).toEqual(expect.arrayContaining(["backend", "frontend"]));
  });

  it("throws when getting keys of non-existent group", () => {
    expect(() => getGroupKeys(dir, "nope")).toThrow(/not found/);
  });
});
