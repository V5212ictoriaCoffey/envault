import { getVaultStats, formatVaultSummary } from './vaultStats';
import { Vault } from './vault';

const makeVault = (overrides: Partial<Vault> = {}): Vault => ({
  data: { API_KEY: 'enc1', SECRET: 'enc2' },
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-06-20T12:00:00.000Z',
  version: '1',
  ...overrides,
} as Vault);

describe('getVaultStats', () => {
  it('returns correct key count', () => {
    const stats = getVaultStats(makeVault());
    expect(stats.totalKeys).toBe(2);
  });

  it('returns all key names', () => {
    const stats = getVaultStats(makeVault());
    expect(stats.keyNames).toEqual(expect.arrayContaining(['API_KEY', 'SECRET']));
  });

  it('returns null for missing timestamps', () => {
    const stats = getVaultStats(makeVault({ createdAt: undefined, updatedAt: undefined }));
    expect(stats.createdAt).toBeNull();
    expect(stats.updatedAt).toBeNull();
  });

  it('returns default version when missing', () => {
    const stats = getVaultStats(makeVault({ version: undefined }));
    expect(stats.version).toBe('1');
  });

  it('handles empty vault', () => {
    const stats = getVaultStats(makeVault({ data: {} }));
    expect(stats.totalKeys).toBe(0);
    expect(stats.keyNames).toEqual([]);
  });
});

describe('formatVaultSummary', () => {
  it('includes key names in output', () => {
    const stats = getVaultStats(makeVault());
    const summary = formatVaultSummary(stats);
    expect(summary).toContain('API_KEY');
    expect(summary).toContain('SECRET');
  });

  it('shows (none) when no keys', () => {
    const stats = getVaultStats(makeVault({ data: {} }));
    const summary = formatVaultSummary(stats);
    expect(summary).toContain('(none)');
  });

  it('shows unknown for missing timestamps', () => {
    const stats = getVaultStats(makeVault({ createdAt: undefined, updatedAt: undefined }));
    const summary = formatVaultSummary(stats);
    expect(summary).toContain('unknown');
  });
});
