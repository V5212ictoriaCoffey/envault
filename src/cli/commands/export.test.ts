import { Command } from 'commander';
import * as fs from 'fs';
import { registerExportCommand } from './export';
import * as vaultModule from '../../vault';
import * as cryptoModule from '../../crypto';

jest.mock('fs');
jest.mock('../../vault');
jest.mock('../../crypto');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockVault = vaultModule as jest.Mocked<typeof vaultModule>;
const mockCrypto = cryptoModule as jest.Mocked<typeof cryptoModule>;

describe('registerExportCommand', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    registerExportCommand(program);
    jest.clearAllMocks();
  });

  it('exits with error if vault file does not exist', async () => {
    mockFs.existsSync.mockReturnValueOnce(false);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(program.parseAsync(['export'], { from: 'user' })).rejects.toThrow('exit');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Vault file not found'));
    exitSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('exits with error if private key file does not exist', async () => {
    mockFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(program.parseAsync(['export'], { from: 'user' })).rejects.toThrow('exit');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Private key file not found'));
    exitSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('exits with error if output file exists and --overwrite is not set', async () => {
    mockFs.existsSync.mockReturnValue(true);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(program.parseAsync(['export'], { from: 'user' })).rejects.toThrow('exit');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('already exists'));
    exitSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('exports vault to .env file successfully', async () => {
    mockFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValueOnce(false);
    mockFs.writeFileSync.mockImplementation(() => {});
    mockCrypto.loadKey.mockReturnValue('mock-private-key');
    mockVault.loadVault.mockReturnValue({ entries: {} } as any);
    mockVault.decryptVault.mockReturnValue({ API_KEY: 'secret123' });
    mockVault.exportVaultToEnv.mockReturnValue('API_KEY=secret123\n');

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await program.parseAsync(['export'], { from: 'user' });

    expect(mockFs.writeFileSync).toHaveBeenCalledWith(expect.any(String), 'API_KEY=secret123\n', 'utf-8');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Exported 1 secret(s)'));
    consoleSpy.mockRestore();
  });
});
