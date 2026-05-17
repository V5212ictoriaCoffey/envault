import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getSecretPath,
  loadSecretStore,
  markSecret,
  unmarkSecret,
  getSecretMetadata,
  isSecret,
  listSecretKeys,
} from './vaultSecret';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-secret-'));
}

describe('vaultSecret', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns empty store when file does not exist', () => {
    expect(loadSecretStore(dir)).toEqual({});
  });

  it('getSecretPath returns correct path', () => {
    expect(getSecretPath(dir)).toBe(path.join(dir, '.envault-secret.json'));
  });

  it('markSecret stores metadata with defaults', () => {
    const store = markSecret(dir, 'DB_PASSWORD');
    expect(store['DB_PASSWORD']).toMatchObject({
      key: 'DB_PASSWORD',
      masked: true,
      redactInLogs: true,
      shareableWith: [],
    });
  });

  it('markSecret respects custom options', () => {
    markSecret(dir, 'API_KEY', { masked: false, shareableWith: ['alice'] });
    const meta = getSecretMetadata(dir, 'API_KEY');
    expect(meta?.masked).toBe(false);
    expect(meta?.shareableWith).toEqual(['alice']);
  });

  it('unmarkSecret removes key from store', () => {
    markSecret(dir, 'SECRET_TOKEN');
    unmarkSecret(dir, 'SECRET_TOKEN');
    expect(isSecret(dir, 'SECRET_TOKEN')).toBe(false);
  });

  it('isSecret returns true for marked keys', () => {
    markSecret(dir, 'PRIVATE_KEY');
    expect(isSecret(dir, 'PRIVATE_KEY')).toBe(true);
  });

  it('isSecret returns false for unmarked keys', () => {
    expect(isSecret(dir, 'PUBLIC_KEY')).toBe(false);
  });

  it('listSecretKeys returns all marked keys', () => {
    markSecret(dir, 'KEY_A');
    markSecret(dir, 'KEY_B');
    const keys = listSecretKeys(dir);
    expect(keys).toContain('KEY_A');
    expect(keys).toContain('KEY_B');
    expect(keys).toHaveLength(2);
  });

  it('getSecretMetadata returns undefined for unknown key', () => {
    expect(getSecretMetadata(dir, 'UNKNOWN')).toBeUndefined();
  });
});
