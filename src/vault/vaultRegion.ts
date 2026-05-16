import * as fs from 'fs';
import * as path from 'path';

export interface RegionStore {
  [key: string]: string;
}

const VALID_REGIONS = [
  'us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1',
  'ap-southeast-1', 'ap-northeast-1', 'sa-east-1', 'global'
];

export function getRegionPath(vaultDir: string): string {
  return path.join(vaultDir, '.envault', 'regions.json');
}

export function loadRegionStore(vaultDir: string): RegionStore {
  const filePath = getRegionPath(vaultDir);
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

export function saveRegionStore(vaultDir: string, store: RegionStore): void {
  const filePath = getRegionPath(vaultDir);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function setRegion(vaultDir: string, key: string, region: string): void {
  if (!VALID_REGIONS.includes(region)) {
    throw new Error(`Invalid region '${region}'. Valid regions: ${VALID_REGIONS.join(', ')}`);
  }
  const store = loadRegionStore(vaultDir);
  store[key] = region;
  saveRegionStore(vaultDir, store);
}

export function removeRegion(vaultDir: string, key: string): void {
  const store = loadRegionStore(vaultDir);
  delete store[key];
  saveRegionStore(vaultDir, store);
}

export function getRegion(vaultDir: string, key: string): string | undefined {
  return loadRegionStore(vaultDir)[key];
}

export function listRegions(vaultDir: string): RegionStore {
  return loadRegionStore(vaultDir);
}

export function getValidRegions(): string[] {
  return [...VALID_REGIONS];
}
