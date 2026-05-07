import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  getLockPath,
  loadLockStore,
  lockKey,
  unlockKey,
  isKeyLocked,
  listLockedKeys,
} from "./vaultLock";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-lock-test-"));
}

describe("vaultLock", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("getLockPath returns correct path", () => {
    expect(getLockPath(tmpDir)).toBe(path.join(tmpDir, ".vault-locks.json"));
  });

  it("loadLockStore returns empty object when file does not exist", () => {
    expect(loadLockStore(tmpDir)).toEqual({});
  });

  it("lockKey adds a lock entry", () => {
    const store = lockKey(tmpDir, "API_KEY", "alice", "sensitive");
    expect(store["API_KEY"]).toBeDefined();
    expect(store["API_KEY"].lockedBy).toBe("alice");
    expect(store["API_KEY"].reason).toBe("sensitive");
    expect(store["API_KEY"].lockedAt).toBeDefined();
  });

  it("lockKey throws if key is already locked", () => {
    lockKey(tmpDir, "API_KEY", "alice");
    expect(() => lockKey(tmpDir, "API_KEY", "bob")).toThrow(
      /already locked by alice/
    );
  });

  it("unlockKey removes a lock entry", () => {
    lockKey(tmpDir, "DB_PASS", "alice");
    const store = unlockKey(tmpDir, "DB_PASS");
    expect(store["DB_PASS"]).toBeUndefined();
  });

  it("unlockKey throws if key is not locked", () => {
    expect(() => unlockKey(tmpDir, "MISSING_KEY")).toThrow(/not locked/);
  });

  it("isKeyLocked returns true for locked key", () => {
    lockKey(tmpDir, "SECRET", "bob");
    expect(isKeyLocked(tmpDir, "SECRET")).toBe(true);
  });

  it("isKeyLocked returns false for unlocked key", () => {
    expect(isKeyLocked(tmpDir, "NOT_LOCKED")).toBe(false);
  });

  it("listLockedKeys returns all locked keys with metadata", () => {
    lockKey(tmpDir, "KEY_A", "alice", "reason A");
    lockKey(tmpDir, "KEY_B", "bob");
    const list = listLockedKeys(tmpDir);
    expect(list).toHaveLength(2);
    const keyA = list.find((e) => e.key === "KEY_A");
    expect(keyA?.lockedBy).toBe("alice");
    expect(keyA?.reason).toBe("reason A");
  });
});
