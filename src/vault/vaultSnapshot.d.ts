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

export function getSnapshotPath(vaultDir: string): string;
export function loadSnapshotStore(vaultDir: string): SnapshotStore;
export function saveSnapshotStore(vaultDir: string, store: SnapshotStore): void;
export function createSnapshot(vaultDir: string, vault: Vault, label: string): string;
export function listSnapshots(vaultDir: string): SnapshotEntry[];
export function getSnapshot(vaultDir: string, id: string): Vault | null;
export function deleteSnapshot(vaultDir: string, id: string): boolean;
