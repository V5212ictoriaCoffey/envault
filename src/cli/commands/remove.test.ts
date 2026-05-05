import { Command } from 'commander';
import { registerRemoveCommand } from './remove';
import * as vaultModule from '../../vault';

jest.mock('../../vault');

const mockVault = {
  version: 1,
  entries: {
    API_KEY: { iv: 'iv1', encryptedKey: 'ek1', encryptedValue: 'ev1' },
    DB_URL: { iv: 'iv2', encryptedKey: 'ek2', encryptedValue: 'ev2' },
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('remove command', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    registerRemoveCommand(program);
    jest.clearAllMocks();

    (vaultModule.loadVault as jest.Mock).mockResolvedValue(
      JSON.parse(JSON.stringify(mockVault))
    );
    (vaultModule.saveVault as jest.Mock).mockResolvedValue(undefined);
  });

  it('removes an existing key from the vault', async () => {
    await program.parseAsync(['node', 'envault', 'remove', 'API_KEY']);

    expect(vaultModule.saveVault).toHaveBeenCalled();
    const savedVault = (vaultModule.saveVault as jest.Mock).mock.calls[0][0];
    expect(savedVault.entries).not.toHaveProperty('API_KEY');
    expect(savedVault.entries).toHaveProperty('DB_URL');
  });

  it('exits with error when key does not exist', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(
      program.parseAsync(['node', 'envault', 'remove', 'NONEXISTENT_KEY'])
    ).rejects.toThrow('exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(vaultModule.saveVault).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });

  it('supports rm alias', async () => {
    await program.parseAsync(['node', 'envault', 'rm', 'DB_URL']);

    const savedVault = (vaultModule.saveVault as jest.Mock).mock.calls[0][0];
    expect(savedVault.entries).not.toHaveProperty('DB_URL');
  });

  it('exits with error when loadVault fails', async () => {
    (vaultModule.loadVault as jest.Mock).mockRejectedValue(new Error('File not found'));
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(
      program.parseAsync(['node', 'envault', 'remove', 'API_KEY'])
    ).rejects.toThrow('exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
