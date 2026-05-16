import fs from 'fs';
import path from 'path';

export interface LabelStore {
  [key: string]: string[];
}

export function getLabelPath(vaultDir: string): string {
  return path.join(vaultDir, '.envault', 'labels.json');
}

export function loadLabelStore(vaultDir: string): LabelStore {
  const filePath = getLabelPath(vaultDir);
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

export function saveLabelStore(vaultDir: string, store: LabelStore): void {
  const filePath = getLabelPath(vaultDir);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function addLabel(vaultDir: string, key: string, label: string): void {
  const store = loadLabelStore(vaultDir);
  if (!store[key]) store[key] = [];
  if (!store[key].includes(label)) {
    store[key].push(label);
  }
  saveLabelStore(vaultDir, store);
}

export function removeLabel(vaultDir: string, key: string, label: string): void {
  const store = loadLabelStore(vaultDir);
  if (!store[key]) return;
  store[key] = store[key].filter((l) => l !== label);
  if (store[key].length === 0) delete store[key];
  saveLabelStore(vaultDir, store);
}

export function getLabels(vaultDir: string, key: string): string[] {
  const store = loadLabelStore(vaultDir);
  return store[key] ?? [];
}

export function getKeysByLabel(vaultDir: string, label: string): string[] {
  const store = loadLabelStore(vaultDir);
  return Object.entries(store)
    .filter(([, labels]) => labels.includes(label))
    .map(([key]) => key);
}

export function clearLabels(vaultDir: string, key: string): void {
  const store = loadLabelStore(vaultDir);
  delete store[key];
  saveLabelStore(vaultDir, store);
}
