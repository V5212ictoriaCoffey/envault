import { Command } from 'commander';
import * as fs from 'fs';
import { registerRotateCommand } from './rotate';
import { generateKeyPair, saveKeyPair } from '../../crypto/keyPair';
import * as vaultModule from '../../vault/vault';
import * as cryptoModule from '../../crypto/encrypt';

jest.mock('fs');
jest.mock('../../crypto/keyPair');
jest.mock('../../vault/vault');
jest.mock('../../crypto/encrypt');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockGenerateKeyPair = generateKeyPair as jest.MockedFunction<typeof generateKeyPair>;
const mockSaveKeyPair = saveKeyPair as jest.MockedFunction<typeof saveKeyPair>;
const mockLoadVault = vaultModule.loadVault as jest.MockedFunction<typeof vaultModule.loadVault>;
const mockSaveVault = vaultModule.saveVault as jest.MockedFunction<typeof vaultModule.saveVault>;
const mockDecryptVault = vaultModule.decryptVault as jest.MockedFunction<typeof vaultModule.decryptVault>;
const mockCreateVault = vaultModule.createVault as jest.MockedFunction<typeof vaultModule.createVault>;
const mockEncryptEnvRecord = cryptoModule.encryptEnvRecord as jest.MockedFunction<typeof cryptoModule.encryptEnvRecord>;

describe('registerRotateCommand', () => {
  let program: Command;
  let exitSpy: jest.SpyInstance;
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    registerRotateCommand(program);
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    exitSpy.mockRestore();
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('exits if vault file does not exist', async () => {
    mockFs.existsSync.mockReturnValue(false);
    await expect(program.parseAsync(['node', 'envault', 'rotate'])).rejects.toThrow('process.exit');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('No vault found'));
  });

  it('exits if old private key is not found', async () => {
    mockFs.existsSync.mockImplementation((p: any) => String(p).endsWith('.envault'));
    await expect(program.parseAsync(['node', 'envault', 'rotate'])).rejects.toThrow('process.exit');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Old private key not found'));
  });

  it('rotates keys and re-encrypts vault successfully', async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockImplementation(() => undefined);
    mockFs.copyFileSync.mockImplementation(() => {});

    const fakeVault = { records: { KEY1: 'enc1' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' };
    mockLoadVault.mockReturnValue(fakeVault as any);
    mockDecryptVault.mockReturnValue({ KEY1: 'value1' });
    mockGenerateKeyPair.mockReturnValue({ publicKey: 'newPub', privateKey: 'newPriv' } as any);
    mockSaveKeyPair.mockImplementation(() => {});
    mockCreateVault.mockReturnValue({ records: {}, createdAt: '', updatedAt: '' } as any);
    mockEncryptEnvRecord.mockReturnValue('newEncrypted' as any);
    mockSaveVault.mockImplementation(() => {});

    await program.parseAsync(['node', 'envault', 'rotate']);

    expect(mockGenerateKeyPair).toHaveBeenCalled();
    expect(mockSaveKeyPair).toHaveBeenCalledWith('newPub', 'newPriv', expect.any(String));
    expect(mockEncryptEnvRecord).toHaveBeenCalledWith('KEY1', 'value1', 'newPub');
    expect(mockSaveVault).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Key rotation complete'));
  });
});
