import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getRenamePath,
  loadRenameStore,
  saveRenameStore,
  recordRename,
  removeRenameRecord,
  resolveRename,
  listRenames,
  renameKeyInVault,
} from './vaultRename';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-rename-'));
}

describe('vaultRename', () => {
  it('getRenamePath returns correct path', () => {
    const dir = makeTempDir();
    expect(getRenamePath(dir)).toBe(path.join(dir, '.envault-renames.json'));
  });

  it('loadRenameStore returns empty object when file missing', () => {
    const dir = makeTempDir();
    expect(loadRenameStore(dir)).toEqual({});
  });

  it('saveRenameStore and loadRenameStore round-trip', () => {
    const dir = makeTempDir();
    const store = { OLD_KEY: 'NEW_KEY' };
    saveRenameStore(dir, store);
    expect(loadRenameStore(dir)).toEqual(store);
  });

  it('recordRename adds entry to store', () => {
    const dir = makeTempDir();
    recordRename(dir, 'API_KEY', 'API_SECRET');
    expect(loadRenameStore(dir)).toEqual({ API_KEY: 'API_SECRET' });
  });

  it('removeRenameRecord deletes entry', () => {
    const dir = makeTempDir();
    recordRename(dir, 'API_KEY', 'API_SECRET');
    removeRenameRecord(dir, 'API_KEY');
    expect(loadRenameStore(dir)).toEqual({});
  });

  it('resolveRename returns mapped key', () => {
    const dir = makeTempDir();
    recordRename(dir, 'DB_PASS', 'DB_PASSWORD');
    expect(resolveRename(dir, 'DB_PASS')).toBe('DB_PASSWORD');
  });

  it('resolveRename returns undefined for unknown key', () => {
    const dir = makeTempDir();
    expect(resolveRename(dir, 'MISSING')).toBeUndefined();
  });

  it('listRenames returns all rename entries', () => {
    const dir = makeTempDir();
    recordRename(dir, 'A', 'B');
    recordRename(dir, 'C', 'D');
    const list = listRenames(dir);
    expect(list).toContainEqual({ from: 'A', to: 'B' });
    expect(list).toContainEqual({ from: 'C', to: 'D' });
  });

  it('renameKeyInVault swaps key correctly', () => {
    const vault = { OLD: 'value', OTHER: 'other' };
    const result = renameKeyInVault(vault, 'OLD', 'NEW');
    expect(result).toHaveProperty('NEW', 'value');
    expect(result).not.toHaveProperty('OLD');
    expect(result).toHaveProperty('OTHER', 'other');
  });

  it('renameKeyInVault throws if old key missing', () => {
    expect(() => renameKeyInVault({}, 'MISSING', 'NEW')).toThrow('not found');
  });

  it('renameKeyInVault throws if new key already exists', () => {
    const vault = { A: '1', B: '2' };
    expect(() => renameKeyInVault(vault, 'A', 'B')).toThrow('already exists');
  });
});
