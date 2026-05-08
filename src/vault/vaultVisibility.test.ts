import fs from "fs";
import os from "os";
import path from "path";
import {
  getVisibilityPath,
  loadVisibilityStore,
  setVisibility,
  removeVisibility,
  getVisibility,
  listByVisibility,
} from "./vaultVisibility";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-visibility-"));
}

describe("vaultVisibility", () => {
  it("returns empty store when file does not exist", () => {
    const dir = makeTempDir();
    expect(loadVisibilityStore(dir)).toEqual({});
  });

  it("getVisibilityPath returns correct path", () => {
    expect(getVisibilityPath("/vault")).toBe("/vault/.visibility.json");
  });

  it("setVisibility stores a level for a key", () => {
    const dir = makeTempDir();
    setVisibility(dir, "API_KEY", "secret");
    const store = loadVisibilityStore(dir);
    expect(store["API_KEY"]).toBe("secret");
  });

  it("getVisibility returns stored level", () => {
    const dir = makeTempDir();
    setVisibility(dir, "DB_URL", "public");
    expect(getVisibility(dir, "DB_URL")).toBe("public");
  });

  it("getVisibility defaults to private for unknown key", () => {
    const dir = makeTempDir();
    expect(getVisibility(dir, "UNKNOWN")).toBe("private");
  });

  it("removeVisibility deletes the key", () => {
    const dir = makeTempDir();
    setVisibility(dir, "TOKEN", "secret");
    removeVisibility(dir, "TOKEN");
    expect(getVisibility(dir, "TOKEN")).toBe("private");
  });

  it("listByVisibility returns keys matching level", () => {
    const dir = makeTempDir();
    setVisibility(dir, "A", "public");
    setVisibility(dir, "B", "secret");
    setVisibility(dir, "C", "public");
    const result = listByVisibility(dir, "public");
    expect(result).toContain("A");
    expect(result).toContain("C");
    expect(result).not.toContain("B");
  });
});
