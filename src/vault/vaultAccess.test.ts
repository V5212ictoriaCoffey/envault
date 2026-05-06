import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  loadAccessList,
  saveAccessList,
  addAccessEntry,
  removeAccessEntry,
  getAccessEntry,
  AccessList,
} from './vaultAccess';

describe('vaultAccess', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-access-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('loadAccessList returns empty list when file does not exist', () => {
    const list = loadAccessList(tmpDir);
    expect(list.entries).toHaveLength(0);
  });

  test('saveAccessList and loadAccessList round-trip', () => {
    const list: AccessList = {
      entries: [{ alias: 'alice', publicKeyPath: '/keys/alice.pub', addedAt: '2024-01-01T00:00:00.000Z' }],
    };
    saveAccessList(list, tmpDir);
    const loaded = loadAccessList(tmpDir);
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0].alias).toBe('alice');
  });

  test('addAccessEntry adds a new entry', () => {
    const list: AccessList = { entries: [] };
    const updated = addAccessEntry(list, 'bob', '/keys/bob.pub');
    expect(updated.entries).toHaveLength(1);
    expect(updated.entries[0].alias).toBe('bob');
    expect(updated.entries[0].addedAt).toBeDefined();
  });

  test('addAccessEntry throws on duplicate alias', () => {
    const list: AccessList = {
      entries: [{ alias: 'alice', publicKeyPath: '/keys/alice.pub', addedAt: '2024-01-01T00:00:00.000Z' }],
    };
    expect(() => addAccessEntry(list, 'alice', '/keys/alice2.pub')).toThrow(
      'already exists'
    );
  });

  test('removeAccessEntry removes an existing entry', () => {
    const list: AccessList = {
      entries: [{ alias: 'alice', publicKeyPath: '/keys/alice.pub', addedAt: '2024-01-01T00:00:00.000Z' }],
    };
    const updated = removeAccessEntry(list, 'alice');
    expect(updated.entries).toHaveLength(0);
  });

  test('removeAccessEntry throws when alias not found', () => {
    const list: AccessList = { entries: [] };
    expect(() => removeAccessEntry(list, 'ghost')).toThrow('not found');
  });

  test('getAccessEntry returns entry by alias', () => {
    const list: AccessList = {
      entries: [{ alias: 'alice', publicKeyPath: '/keys/alice.pub', addedAt: '2024-01-01T00:00:00.000Z' }],
    };
    const entry = getAccessEntry(list, 'alice');
    expect(entry?.publicKeyPath).toBe('/keys/alice.pub');
  });

  test('getAccessEntry returns undefined for unknown alias', () => {
    const list: AccessList = { entries: [] };
    expect(getAccessEntry(list, 'nobody')).toBeUndefined();
  });
});
