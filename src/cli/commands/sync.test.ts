import { Command } from 'commander';
import * as fs from 'fs';
import { registerSyncCommand } from './sync';
import * as vaultModule from '../../vault/vault';
import * as vaultMerge from '../../vault/vaultMerge';
import * as cryptoModule from '../../crypto/keyPair';

jest.mock('fs');
jest.mock('../../vault/vault');
jest.mock('../../vault/vaultMerge');
jest.mock('../../crypto/keyPair');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockLoadVault = vaultModule.loadVault as jest.Mock;
const mockSaveVault = vaultModule.saveVault as jest.Mock;
const mockDiff = vaultMerge.diffVaultKeys as jest.Mock;
const mockMerge = vaultMerge.mergeVaults as jest.Mock;
const mockLoadKey = cryptoModule.loadKey as jest.Mock;

const baseVault = { version: 1, records: { KEY: 'encryptedValue' }, createdAt: '' };
const remoteVault = { version: 1, records: { KEY: 'encryptedValue', NEW_KEY: 'enc2' }, createdAt: '' };
const mergedVault = { version: 1, records: { KEY: 'encryptedValue', NEW_KEY: 'enc2' }, createdAt: '' };

beforeEach(() => {
  jest.clearAllMocks();
  mockFs.existsSync = jest.fn().mockReturnValue(true);
  mockLoadVault.mockImplementation((p: string) => (p.includes('remote') ? remoteVault : baseVault));
  mockDiff.mockReturnValue({ added: ['NEW_KEY'], updated: [], removed: [] });
  mockMerge.mockReturnValue(mergedVault);
  mockLoadKey.mockReturnValue('mockPrivateKey');
});

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.exitOverride();
  registerSyncCommand(program);
  await program.parseAsync(['node', 'envault', ...args]);
}

describe('sync command', () => {
  it('syncs remote vault into local vault', async () => {
    await runCommand(['sync', 'remote.vault.json']);
    expect(mockMerge).toHaveBeenCalled();
    expect(mockSaveVault).toHaveBeenCalledWith(mergedVault, '.envault/vault.json');
  });

  it('exits if remote vault file does not exist', async () => {
    mockFs.existsSync = jest.fn().mockReturnValueOnce(false);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(runCommand(['sync', 'missing.json'])).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits if local vault does not exist', async () => {
    mockFs.existsSync = jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(runCommand(['sync', 'remote.vault.json'])).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('does not save when --dry-run is set', async () => {
    await runCommand(['sync', 'remote.vault.json', '--dry-run']);
    expect(mockSaveVault).not.toHaveBeenCalled();
  });

  it('prints no-op message when vaults are identical', async () => {
    mockDiff.mockReturnValue({ added: [], updated: [], removed: [] });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runCommand(['sync', 'remote.vault.json']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('already in sync'));
    expect(mockSaveVault).not.toHaveBeenCalled();
  });
});
