import * as fs from "fs";
import * as path from "path";
import { Vault } from "./vault";

export interface SnapshotEntry {
  id: string;
  label: string;
  createdAt: string;
  keys: string[];
}

export interface SnapshotStore {
  snapshots: Record<string, { label: string; createdAt: string; vault: Vault }>;
}

export function getSnapshotPath(vaultDir: string): string {
  return path.join(vaultDir, ".snapshots.json");
}

export function loadSnapshotStore(vaultDir: string): SnapshotStore {
  const p = getSnapshotPath(vaultDir);
  if (!fs.existsSync(p)) return { snapshots: {} };
  return JSON.parse(fs.readFileSync(p, "utf-8")) as SnapshotStore;
}

export function saveSnapshotStore(vaultDir: string, store: SnapshotStore): void {
  fs.writeFileSync(getSnapshotPath(vaultDir), JSON.stringify(store, null, 2));
}

export function createSnapshot(vaultDir: string, vault: Vault, label: string): string {
  const store = loadSnapshotStore(vaultDir);
  const id = `snap_${Date.now()}`;
  store.snapshots[id] = {
    label,
    createdAt: new Date().toISOString(),
    vault,
  };
  saveSnapshotStore(vaultDir, store);
  return id;
}

export function listSnapshots(vaultDir: string): SnapshotEntry[] {
  const store = loadSnapshotStore(vaultDir);
  return Object.entries(store.snapshots).map(([id, s]) => ({
    id,
    label: s.label,
    createdAt: s.createdAt,
    keys: Object.keys(s.vault.records),
  }));
}

export function getSnapshot(vaultDir: string, id: string): Vault | null {
  const store = loadSnapshotStore(vaultDir);
  return store.snapshots[id]?.vault ?? null;
}

export function deleteSnapshot(vaultDir: string, id: string): boolean {
  const store = loadSnapshotStore(vaultDir);
  if (!store.snapshots[id]) return false;
  delete store.snapshots[id];
  saveSnapshotStore(vaultDir, store);
  return true;
}
