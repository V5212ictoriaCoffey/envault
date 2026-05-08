import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  getRequirePath,
  loadRequireStore,
  requireKey,
  unrequireKey,
  isKeyRequired,
  listRequiredKeys,
  validateRequiredKeys,
} from "./vaultRequire";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-require-"));
}

describe("vaultRequire", () => {
  it("returns empty store when file does not exist", () => {
    const dir = makeTempDir();
    expect(loadRequireStore(dir)).toEqual({ required: [] });
  });

  it("requireKey adds a key to the store", () => {
    const dir = makeTempDir();
    requireKey(dir, "API_KEY");
    expect(isKeyRequired(dir, "API_KEY")).toBe(true);
  });

  it("requireKey does not duplicate keys", () => {
    const dir = makeTempDir();
    requireKey(dir, "API_KEY");
    requireKey(dir, "API_KEY");
    expect(listRequiredKeys(dir)).toEqual(["API_KEY"]);
  });

  it("unrequireKey removes a key", () => {
    const dir = makeTempDir();
    requireKey(dir, "API_KEY");
    unrequireKey(dir, "API_KEY");
    expect(isKeyRequired(dir, "API_KEY")).toBe(false);
  });

  it("listRequiredKeys returns all required keys", () => {
    const dir = makeTempDir();
    requireKey(dir, "DB_URL");
    requireKey(dir, "SECRET");
    expect(listRequiredKeys(dir)).toEqual(["DB_URL", "SECRET"]);
  });

  it("validateRequiredKeys returns missing keys", () => {
    const dir = makeTempDir();
    requireKey(dir, "DB_URL");
    requireKey(dir, "SECRET");
    const missing = validateRequiredKeys(dir, ["DB_URL"]);
    expect(missing).toEqual(["SECRET"]);
  });

  it("validateRequiredKeys returns empty when all present", () => {
    const dir = makeTempDir();
    requireKey(dir, "DB_URL");
    const missing = validateRequiredKeys(dir, ["DB_URL", "SECRET"]);
    expect(missing).toEqual([]);
  });

  it("getRequirePath returns correct path", () => {
    expect(getRequirePath("/tmp/vault")).toBe(
      "/tmp/vault/.envault-required.json"
    );
  });
});
