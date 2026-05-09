import fs from "fs";
import os from "os";
import path from "path";
import {
  addDependency,
  removeDependency,
  getDependencies,
  getDependents,
  clearDependencies,
  loadDependencyStore,
} from "./vaultDependency";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-dep-"));
}

describe("vaultDependency", () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("returns empty array for unknown key", () => {
    expect(getDependencies(dir, "DB_URL")).toEqual([]);
  });

  it("adds a dependency", () => {
    addDependency(dir, "DB_URL", "DB_HOST");
    expect(getDependencies(dir, "DB_URL")).toContain("DB_HOST");
  });

  it("does not duplicate dependencies", () => {
    addDependency(dir, "DB_URL", "DB_HOST");
    addDependency(dir, "DB_URL", "DB_HOST");
    expect(getDependencies(dir, "DB_URL")).toHaveLength(1);
  });

  it("removes a dependency", () => {
    addDependency(dir, "DB_URL", "DB_HOST");
    addDependency(dir, "DB_URL", "DB_PORT");
    removeDependency(dir, "DB_URL", "DB_HOST");
    expect(getDependencies(dir, "DB_URL")).not.toContain("DB_HOST");
    expect(getDependencies(dir, "DB_URL")).toContain("DB_PORT");
  });

  it("removes key from store when all deps removed", () => {
    addDependency(dir, "DB_URL", "DB_HOST");
    removeDependency(dir, "DB_URL", "DB_HOST");
    const store = loadDependencyStore(dir);
    expect(store["DB_URL"]).toBeUndefined();
  });

  it("returns dependents for a key", () => {
    addDependency(dir, "DB_URL", "DB_HOST");
    addDependency(dir, "API_URL", "DB_HOST");
    const dependents = getDependents(dir, "DB_HOST");
    expect(dependents).toContain("DB_URL");
    expect(dependents).toContain("API_URL");
  });

  it("clears all dependencies for a key", () => {
    addDependency(dir, "DB_URL", "DB_HOST");
    addDependency(dir, "DB_URL", "DB_PORT");
    clearDependencies(dir, "DB_URL");
    expect(getDependencies(dir, "DB_URL")).toEqual([]);
  });
});
