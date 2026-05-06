import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export interface PinStore {
  pins: Record<string, string>; // key => tag alias pinned
  pinnedAt: Record<string, string>; // key => ISO timestamp
}

export function getPinPath(vaultDir: string): string {
  return path.join(vaultDir, ".pins.json");
}

export function loadPinStore(vaultDir: string): PinStore {
  const pinPath = getPinPath(vaultDir);
  if (!fs.existsSync(pinPath)) {
    return { pins: {}, pinnedAt: {} };
  }
  const raw = fs.readFileSync(pinPath, "utf-8");
  return JSON.parse(raw) as PinStore;
}

export function savePinStore(vaultDir: string, store: PinStore): void {
  const pinPath = getPinPath(vaultDir);
  fs.writeFileSync(pinPath, JSON.stringify(store, null, 2), "utf-8");
}

export function pinKey(vaultDir: string, key: string, alias: string): PinStore {
  const store = loadPinStore(vaultDir);
  store.pins[key] = alias;
  store.pinnedAt[key] = new Date().toISOString();
  savePinStore(vaultDir, store);
  return store;
}

export function unpinKey(vaultDir: string, key: string): PinStore {
  const store = loadPinStore(vaultDir);
  delete store.pins[key];
  delete store.pinnedAt[key];
  savePinStore(vaultDir, store);
  return store;
}

export function getPinnedKeys(vaultDir: string): string[] {
  const store = loadPinStore(vaultDir);
  return Object.keys(store.pins);
}

export function isPinned(vaultDir: string, key: string): boolean {
  const store = loadPinStore(vaultDir);
  return key in store.pins;
}

export function formatPinList(store: PinStore): string {
  const keys = Object.keys(store.pins);
  if (keys.length === 0) return "No pinned keys.";
  return keys
    .map((k) => `  ${k}  [${store.pins[k]}]  pinned at ${store.pinnedAt[k]}`)
    .join("\n");
}
