import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getSensitivityPath,
  loadSensitivityStore,
  setSensitivity,
  removeSensitivity,
  getSensitivity,
  getKeysBySensitivity,
  isValidSensitivityLevel,
} from './vaultSensitivity';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-sensitivity-'));
}

describe('vaultSensitivity', () => {
  it('returns empty store when no file exists', () => {
    const dir = makeTempDir();
    const store = loadSensitivityStore(dir);
    expect(store).toEqual({});
  });

  it('getSensitivityPath returns correct path', () => {
    const dir = makeTempDir();
    expect(getSensitivityPath(dir)).toBe(path.join(dir, '.sensitivity.json'));
  });

  it('setSensitivity stores a level for a key', () => {
    const dir = makeTempDir();
    setSensitivity(dir, 'DB_PASSWORD', 'secret');
    const store = loadSensitivityStore(dir);
    expect(store['DB_PASSWORD']).toBe('secret');
  });

  it('getSensitivity retrieves stored level', () => {
    const dir = makeTempDir();
    setSensitivity(dir, 'API_KEY', 'confidential');
    expect(getSensitivity(dir, 'API_KEY')).toBe('confidential');
  });

  it('getSensitivity returns undefined for unknown key', () => {
    const dir = makeTempDir();
    expect(getSensitivity(dir, 'UNKNOWN')).toBeUndefined();
  });

  it('removeSensitivity deletes a key', () => {
    const dir = makeTempDir();
    setSensitivity(dir, 'TOKEN', 'internal');
    removeSensitivity(dir, 'TOKEN');
    expect(getSensitivity(dir, 'TOKEN')).toBeUndefined();
  });

  it('getKeysBySensitivity filters correctly', () => {
    const dir = makeTempDir();
    setSensitivity(dir, 'DB_PASS', 'secret');
    setSensitivity(dir, 'JWT_SECRET', 'secret');
    setSensitivity(dir, 'APP_NAME', 'public');
    const secrets = getKeysBySensitivity(dir, 'secret');
    expect(secrets).toContain('DB_PASS');
    expect(secrets).toContain('JWT_SECRET');
    expect(secrets).not.toContain('APP_NAME');
  });

  it('isValidSensitivityLevel validates correctly', () => {
    expect(isValidSensitivityLevel('secret')).toBe(true);
    expect(isValidSensitivityLevel('confidential')).toBe(true);
    expect(isValidSensitivityLevel('internal')).toBe(true);
    expect(isValidSensitivityLevel('public')).toBe(true);
    expect(isValidSensitivityLevel('unknown')).toBe(false);
    expect(isValidSensitivityLevel('')).toBe(false);
  });
});
