import { Command } from 'commander';
import { registerListCommand } from './list';
import * as vaultModule from '../../vault';
import * as cryptoModule from '../../crypto';
import * as encryptModule from '../../crypto/encrypt';
import * as fs from 'fs';

jest.mock('../../vault');
jest.mock('../../crypto');
jest.mock('../../crypto/encrypt');
jest.mock('fs');

const mockLoadVault = vaultModule.loadVault as jest.Mock;
const mockLoadKey = cryptoModule.loadKey as jest.Mock;
const mockDecrypt = encryptModule.decryptWithPrivateKey as jest.Mock;
const mockExistsSync = fs.existsSync as jest.Mock;

describe('registerListCommand', () => {
  let program: Command;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    program = new Command();
    registerListCommand(program);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => { throw new Error(`exit:${code}`); });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exits if vault does not exist', async () => {
    mockExistsSync.mockReturnValue(false);
    await expect(program.parseAsync(['node', 'test', 'list'])).rejects.toThrow('exit:1');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('No vault found'));
  });

  it('shows empty message when vault has no entries', async () => {
    mockExistsSync.mockReturnValue(true);
    mockLoadVault.mockReturnValue({ entries: {} });
    await program.parseAsync(['node', 'test', 'list']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Vault is empty'));
  });

  it('lists keys without values by default', async () => {
    mockExistsSync.mockReturnValue(true);
    mockLoadVault.mockReturnValue({ entries: { DB_URL: 'enc1', API_KEY: 'enc2' } });
    await program.parseAsync(['node', 'test', 'list']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('API_KEY'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('DB_URL'));
  });

  it('reveals values when --values flag is set', async () => {
    mockExistsSync.mockReturnValue(true);
    mockLoadVault.mockReturnValue({ entries: { SECRET: 'encryptedValue' } });
    mockLoadKey.mockReturnValue('privateKeyContent');
    mockDecrypt.mockReturnValue('mySecretValue');
    await program.parseAsync(['node', 'test', 'list', '--values']);
    expect(mockDecrypt).toHaveBeenCalledWith('encryptedValue', 'privateKeyContent');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('SECRET=mySecretValue'));
  });

  it('exits if private key not found when --values used', async () => {
    mockExistsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
    mockLoadVault.mockReturnValue({ entries: { SECRET: 'enc' } });
    await expect(program.parseAsync(['node', 'test', 'list', '--values'])).rejects.toThrow('exit:1');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Private key not found'));
  });
});
