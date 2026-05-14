import * as fs from 'fs';
import * as path from 'path';

export type SensitivityLevel = 'public' | 'internal' | 'confidential' | 'secret';

export interface SensitivityStore {
  [key: string]: SensitivityLevel;
}

export function getSensitivityPath(vaultDir: string): string {
  return path.join(vaultDir, '.sensitivity.json');
}

export function loadSensitivityStore(vaultDir: string): SensitivityStore {
  const filePath = getSensitivityPath(vaultDir);
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as SensitivityStore;
}

export function saveSensitivityStore(vaultDir: string, store: SensitivityStore): void {
  const filePath = getSensitivityPath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function setSensitivity(vaultDir: string, key: string, level: SensitivityLevel): SensitivityStore {
  const store = loadSensitivityStore(vaultDir);
  store[key] = level;
  saveSensitivityStore(vaultDir, store);
  return store;
}

export function removeSensitivity(vaultDir: string, key: string): SensitivityStore {
  const store = loadSensitivityStore(vaultDir);
  delete store[key];
  saveSensitivityStore(vaultDir, store);
  return store;
}

export function getSensitivity(vaultDir: string, key: string): SensitivityLevel | undefined {
  const store = loadSensitivityStore(vaultDir);
  return store[key];
}

export function getKeysBySensitivity(vaultDir: string, level: SensitivityLevel): string[] {
  const store = loadSensitivityStore(vaultDir);
  return Object.entries(store)
    .filter(([, v]) => v === level)
    .map(([k]) => k);
}

export const SENSITIVITY_LEVELS: SensitivityLevel[] = ['public', 'internal', 'confidential', 'secret'];

export function isValidSensitivityLevel(value: string): value is SensitivityLevel {
  return SENSITIVITY_LEVELS.includes(value as SensitivityLevel);
}
