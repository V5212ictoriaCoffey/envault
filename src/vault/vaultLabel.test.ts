import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  getLabelPath,
  loadLabelStore,
  saveLabelStore,
  addLabel,
  removeLabel,
  getLabels,
  getKeysByLabel,
  clearLabels,
} from './vaultLabel';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-label-'));
}

describe('vaultLabel', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty store when no file exists', () => {
    expect(loadLabelStore(tmpDir)).toEqual({});
  });

  it('saves and loads a label store', () => {
    const store = { API_KEY: ['sensitive', 'external'] };
    saveLabelStore(tmpDir, store);
    expect(loadLabelStore(tmpDir)).toEqual(store);
  });

  it('getLabelPath returns correct path', () => {
    expect(getLabelPath(tmpDir)).toBe(path.join(tmpDir, '.envault', 'labels.json'));
  });

  it('addLabel adds a label to a key', () => {
    addLabel(tmpDir, 'DB_URL', 'critical');
    expect(getLabels(tmpDir, 'DB_URL')).toContain('critical');
  });

  it('addLabel does not duplicate labels', () => {
    addLabel(tmpDir, 'DB_URL', 'critical');
    addLabel(tmpDir, 'DB_URL', 'critical');
    expect(getLabels(tmpDir, 'DB_URL').filter((l) => l === 'critical').length).toBe(1);
  });

  it('removeLabel removes a specific label', () => {
    addLabel(tmpDir, 'DB_URL', 'critical');
    addLabel(tmpDir, 'DB_URL', 'infra');
    removeLabel(tmpDir, 'DB_URL', 'critical');
    expect(getLabels(tmpDir, 'DB_URL')).not.toContain('critical');
    expect(getLabels(tmpDir, 'DB_URL')).toContain('infra');
  });

  it('removeLabel cleans up key when no labels remain', () => {
    addLabel(tmpDir, 'DB_URL', 'critical');
    removeLabel(tmpDir, 'DB_URL', 'critical');
    const store = loadLabelStore(tmpDir);
    expect(store['DB_URL']).toBeUndefined();
  });

  it('getKeysByLabel returns all keys with a given label', () => {
    addLabel(tmpDir, 'API_KEY', 'sensitive');
    addLabel(tmpDir, 'DB_PASS', 'sensitive');
    addLabel(tmpDir, 'PORT', 'infra');
    expect(getKeysByLabel(tmpDir, 'sensitive')).toEqual(expect.arrayContaining(['API_KEY', 'DB_PASS']));
    expect(getKeysByLabel(tmpDir, 'sensitive')).not.toContain('PORT');
  });

  it('clearLabels removes all labels for a key', () => {
    addLabel(tmpDir, 'API_KEY', 'sensitive');
    addLabel(tmpDir, 'API_KEY', 'external');
    clearLabels(tmpDir, 'API_KEY');
    expect(getLabels(tmpDir, 'API_KEY')).toEqual([]);
  });
});
