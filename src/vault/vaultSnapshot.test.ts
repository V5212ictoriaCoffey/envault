import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  createSnapshot,
  deleteSnapshot,
  getSnapshot,
  listSnapshots,
  loadSnapshotStore,
} from "./vaultSnapshot";
import { Vault } from "./vault";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-snap-"));
}

function makeVault(keys: string[]): Vault {
  const records: Record<string, string> = {};
  keys.forEach((k) => (records[k] = `enc_${k}`));
  return { version: 1, records, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

describe("vaultSnapshot", () => {
  it("starts with empty store", () => {
    const dir = makeTempDir();
    const store = loadSnapshotStore(dir);
    expect(store.snapshots).toEqual({});
  });

  it("creates a snapshot and returns an id", () => {
    const dir = makeTempDir();
    const vault = makeVault(["API_KEY", "DB_URL"]);
    const id = createSnapshot(dir, vault, "before-deploy");
    expect(id).toMatch(/^snap_/);
  });

  it("lists snapshots with correct metadata", () => {
    const dir = makeTempDir();
    const vault = makeVault(["A", "B"]);
    createSnapshot(dir, vault, "my-snap");
    const entries = listSnapshots(dir);
    expect(entries).toHaveLength(1);
    expect(entries[0].label).toBe("my-snap");
    expect(entries[0].keys).toEqual(expect.arrayContaining(["A", "B"]));
  });

  it("retrieves a snapshot by id", () => {
    const dir = makeTempDir();
    const vault = makeVault(["SECRET"]);
    const id = createSnapshot(dir, vault, "test");
    const retrieved = getSnapshot(dir, id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.records["SECRET"]).toBe("enc_SECRET");
  });

  it("returns null for unknown id", () => {
    const dir = makeTempDir();
    expect(getSnapshot(dir, "snap_9999")).toBeNull();
  });

  it("deletes a snapshot", () => {
    const dir = makeTempDir();
    const id = createSnapshot(dir, makeVault(["X"]), "to-delete");
    expect(deleteSnapshot(dir, id)).toBe(true);
    expect(listSnapshots(dir)).toHaveLength(0);
  });

  it("returns false when deleting non-existent snapshot", () => {
    const dir = makeTempDir();
    expect(deleteSnapshot(dir, "snap_000")).toBe(false);
  });
});
