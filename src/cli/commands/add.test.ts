import { Command } from 'commander';
import { registerAddCommand } from './add';
import * as vaultModule from '../../vault';
import * as cryptoModule from '../../crypto';
import * as encryptModule from '../../crypto/encrypt';

jest.mock('../../vault');
jest.mock('../../crypto');
jest.mock('../../crypto/encrypt');

const mockVault = {
  version: 1,
  entries: {},
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockEncrypted = { iv: 'iv123', encryptedKey: 'ek', encryptedValue: 'ev' };

describe('add command', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    registerAddCommand(program);
    jest.clearAllMocks();

    (vaultModule.loadVault as jest.Mock).mockResolvedValue({ ...mockVault, entries: {} });
    (vaultModule.saveVault as jest.Mock).mockResolvedValue(undefined);
    (cryptoModule.loadKey as jest.Mock).mockResolvedValue('mock-public-key');
    (encryptModule.encryptEnvRecord as jest.Mock).mockReturnValue(mockEncrypted);
  });

  it('adds a key with --value flag', async () => {
    await program.parseAsync(['node', 'envault', 'add', 'API_KEY', '--value', 'secret123']);

    expect(cryptoModule.loadKey).toHaveBeenCalled();
    expect(encryptModule.encryptEnvRecord).toHaveBeenCalledWith('API_KEY', 'secret123', 'mock-public-key');
    expect(vaultModule.saveVault).toHaveBeenCalled();

    const savedVault = (vaultModule.saveVault as jest.Mock).mock.calls[0][0];
    expect(savedVault.entries['API_KEY']).toEqual(mockEncrypted);
  });

  it('updates an existing key', async () => {
    const existingVault = {
      ...mockVault,
      entries: { API_KEY: { iv: 'old', encryptedKey: 'old', encryptedValue: 'old' } },
    };
    (vaultModule.loadVault as jest.Mock).mockResolvedValue(existingVault);

    await program.parseAsync(['node', 'envault', 'add', 'API_KEY', '--value', 'newvalue']);

    const savedVault = (vaultModule.saveVault as jest.Mock).mock.calls[0][0];
    expect(savedVault.entries['API_KEY']).toEqual(mockEncrypted);
  });

  it('exits with error when loadVault fails', async () => {
    (vaultModule.loadVault as jest.Mock).mockRejectedValue(new Error('Vault not found'));
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(
      program.parseAsync(['node', 'envault', 'add', 'KEY', '--value', 'val'])
    ).rejects.toThrow('exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
