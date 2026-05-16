import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getRegionPath,
  loadRegionStore,
  saveRegionStore,
  setRegion,
  removeRegion,
  getRegion,
  listRegions,
  getValidRegions
} from './vaultRegion';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-region-'));
}

describe('vaultRegion', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty store if file does not exist', () => {
    expect(loadRegionStore(tmpDir)).toEqual({});
  });

  it('saves and loads a region store', () => {
    const store = { API_KEY: 'us-east-1', DB_URL: 'eu-west-1' };
    saveRegionStore(tmpDir, store);
    expect(loadRegionStore(tmpDir)).toEqual(store);
  });

  it('sets a valid region for a key', () => {
    setRegion(tmpDir, 'API_KEY', 'us-west-2');
    expect(getRegion(tmpDir, 'API_KEY')).toBe('us-west-2');
  });

  it('throws on invalid region', () => {
    expect(() => setRegion(tmpDir, 'API_KEY', 'invalid-region')).toThrow(/Invalid region/);
  });

  it('removes a region entry', () => {
    setRegion(tmpDir, 'API_KEY', 'global');
    removeRegion(tmpDir, 'API_KEY');
    expect(getRegion(tmpDir, 'API_KEY')).toBeUndefined();
  });

  it('returns undefined for unknown key', () => {
    expect(getRegion(tmpDir, 'MISSING_KEY')).toBeUndefined();
  });

  it('lists all regions', () => {
    setRegion(tmpDir, 'KEY_A', 'ap-northeast-1');
    setRegion(tmpDir, 'KEY_B', 'sa-east-1');
    const regions = listRegions(tmpDir);
    expect(regions['KEY_A']).toBe('ap-northeast-1');
    expect(regions['KEY_B']).toBe('sa-east-1');
  });

  it('returns valid regions list', () => {
    const valid = getValidRegions();
    expect(valid).toContain('us-east-1');
    expect(valid).toContain('global');
    expect(valid.length).toBeGreaterThan(0);
  });

  it('getRegionPath returns correct path', () => {
    const p = getRegionPath(tmpDir);
    expect(p).toContain('.envault');
    expect(p).toContain('regions.json');
  });
});
