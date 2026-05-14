import * as fs from 'fs';
import * as path from 'path';

export type LifecycleStage = 'draft' | 'active' | 'deprecated' | 'archived' | 'deleted';

export interface LifecycleEntry {
  stage: LifecycleStage;
  updatedAt: string;
  reason?: string;
}

export type LifecycleStore = Record<string, LifecycleEntry>;

export function getLifecyclePath(vaultDir: string): string {
  return path.join(vaultDir, '.envault', 'lifecycle.json');
}

export function loadLifecycleStore(vaultDir: string): LifecycleStore {
  const filePath = getLifecyclePath(vaultDir);
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function saveLifecycleStore(vaultDir: string, store: LifecycleStore): void {
  const filePath = getLifecyclePath(vaultDir);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function setLifecycleStage(
  vaultDir: string,
  key: string,
  stage: LifecycleStage,
  reason?: string
): void {
  const store = loadLifecycleStore(vaultDir);
  store[key] = { stage, updatedAt: new Date().toISOString(), reason };
  saveLifecycleStore(vaultDir, store);
}

export function removeLifecycleEntry(vaultDir: string, key: string): void {
  const store = loadLifecycleStore(vaultDir);
  delete store[key];
  saveLifecycleStore(vaultDir, store);
}

export function getLifecycleEntry(vaultDir: string, key: string): LifecycleEntry | undefined {
  return loadLifecycleStore(vaultDir)[key];
}

export function listKeysByStage(vaultDir: string, stage: LifecycleStage): string[] {
  const store = loadLifecycleStore(vaultDir);
  return Object.entries(store)
    .filter(([, entry]) => entry.stage === stage)
    .map(([key]) => key);
}

export function formatLifecycleSummary(store: LifecycleStore): string {
  const entries = Object.entries(store);
  if (entries.length === 0) return 'No lifecycle stages assigned.';
  return entries
    .map(([key, entry]) => {
      const reason = entry.reason ? ` (${entry.reason})` : '';
      return `  ${key}: ${entry.stage}${reason} [${entry.updatedAt}]`;
    })
    .join('\n');
}
