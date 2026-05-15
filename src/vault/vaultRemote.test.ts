import fs from "fs";
import os from "os";
import path from "path";
import {
  getRemotePath,
  loadRemoteStore,
  addRemote,
  removeRemote,
  getRemote,
  listRemotes,
  updateLastSynced,
} from "./vaultRemote";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-remote-test-"));
}

describe("vaultRemote", () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("getRemotePath returns correct path", () => {
    expect(getRemotePath(dir)).toBe(path.join(dir, ".envault-remotes.json"));
  });

  it("loadRemoteStore returns empty store when file missing", () => {
    const store = loadRemoteStore(dir);
    expect(store.remotes).toEqual({});
  });

  it("addRemote persists a remote config", () => {
    addRemote(dir, "origin", { url: "https://example.com/vault", provider: "http" });
    const store = loadRemoteStore(dir);
    expect(store.remotes["origin"]).toMatchObject({
      url: "https://example.com/vault",
      provider: "http",
    });
  });

  it("addRemote supports optional headers", () => {
    addRemote(dir, "s3-remote", {
      url: "s3://my-bucket/vault",
      provider: "s3",
      headers: { Authorization: "Bearer token" },
    });
    const cfg = getRemote(dir, "s3-remote");
    expect(cfg?.headers?.Authorization).toBe("Bearer token");
  });

  it("removeRemote deletes a remote", () => {
    addRemote(dir, "origin", { url: "https://example.com", provider: "http" });
    removeRemote(dir, "origin");
    expect(getRemote(dir, "origin")).toBeUndefined();
  });

  it("listRemotes returns all remotes with names", () => {
    addRemote(dir, "alpha", { url: "https://alpha.io", provider: "http" });
    addRemote(dir, "beta", { url: "https://beta.io", provider: "gcs" });
    const remotes = listRemotes(dir);
    expect(remotes).toHaveLength(2);
    expect(remotes.map((r) => r.name)).toContain("alpha");
    expect(remotes.map((r) => r.name)).toContain("beta");
  });

  it("updateLastSynced sets ISO timestamp", () => {
    addRemote(dir, "origin", { url: "https://example.com", provider: "http" });
    const before = Date.now();
    updateLastSynced(dir, "origin");
    const cfg = getRemote(dir, "origin");
    expect(cfg?.lastSynced).toBeDefined();
    expect(new Date(cfg!.lastSynced!).getTime()).toBeGreaterThanOrEqual(before);
  });

  it("updateLastSynced is a no-op for unknown remote", () => {
    const store = updateLastSynced(dir, "nonexistent");
    expect(store.remotes["nonexistent"]).toBeUndefined();
  });
});
