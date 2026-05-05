import { diffVaultKeys, mergeVaults } from './vaultMerge';
import { Vault } from './vault';

const makeVault = (records: Record<string, string>): Vault => ({
  version: 1,
  records,
  createdAt: '2024-01-01T00:00:00.000Z',
});

describe('diffVaultKeys', () => {
  it('detects added keys', () => {
    const local = makeVault({ A: 'enc1' });
    const remote = makeVault({ A: 'enc1', B: 'enc2' });
    const diff = diffVaultKeys(local, remote);
    expect(diff.added).toEqual(['B']);
    expect(diff.updated).toEqual([]);
    expect(diff.removed).toEqual([]);
  });

  it('detects removed keys', () => {
    const local = makeVault({ A: 'enc1', B: 'enc2' });
    const remote = makeVault({ A: 'enc1' });
    const diff = diffVaultKeys(local, remote);
    expect(diff.removed).toEqual(['B']);
    expect(diff.added).toEqual([]);
  });

  it('detects updated keys', () => {
    const local = makeVault({ A: 'enc1' });
    const remote = makeVault({ A: 'enc1_changed' });
    const diff = diffVaultKeys(local, remote);
    expect(diff.updated).toEqual(['A']);
  });

  it('returns empty diff for identical vaults', () => {
    const vault = makeVault({ A: 'enc1', B: 'enc2' });
    const diff = diffVaultKeys(vault, vault);
    expect(diff.added).toHaveLength(0);
    expect(diff.updated).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
  });
});

describe('mergeVaults', () => {
  it('includes added keys from remote', () => {
    const local = makeVault({ A: 'enc1' });
    const remote = makeVault({ A: 'enc1', B: 'enc2' });
    const merged = mergeVaults(local, remote, 'privateKey');
    expect(merged.records['B']).toBe('enc2');
  });

  it('applies updated values from remote', () => {
    const local = makeVault({ A: 'old' });
    const remote = makeVault({ A: 'new' });
    const merged = mergeVaults(local, remote, 'privateKey');
    expect(merged.records['A']).toBe('new');
  });

  it('removes keys absent in remote', () => {
    const local = makeVault({ A: 'enc1', B: 'enc2' });
    const remote = makeVault({ A: 'enc1' });
    const merged = mergeVaults(local, remote, 'privateKey');
    expect(merged.records['B']).toBeUndefined();
  });

  it('sets updatedAt on merged vault', () => {
    const local = makeVault({ A: 'enc1' });
    const remote = makeVault({ A: 'enc1', B: 'enc2' });
    const merged = mergeVaults(local, remote, 'privateKey');
    expect(merged.updatedAt).toBeDefined();
  });
});
