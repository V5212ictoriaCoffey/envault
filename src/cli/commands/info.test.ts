import { Command } from 'commander';
import { registerInfoCommand } from './info';
import * as vaultModule from '../../vault';
import * as fs from 'fs';

jest.mock('../../vault');
jest.mock('fs');

const mockLoadVault = vaultModule.loadVault as jest.MockedFunction<typeof vaultModule.loadVault>;
const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;

describe('registerInfoCommand', () => {
  let program: Command;
  let consoleSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    program = new Command();
    registerInfoCommand(program);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('should display vault info when vault exists', async () => {
    mockExistsSync.mockReturnValue(true);
    mockLoadVault.mockResolvedValue({
      data: { API_KEY: 'encrypted', DB_PASS: 'encrypted' },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-06-01T00:00:00.000Z',
      version: '1',
    } as any);

    await program.parseAsync(['node', 'envault', 'info']);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Envault Info'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Keys stored:   2'));
  });

  it('should exit if vault does not exist', async () => {
    mockExistsSync.mockReturnValue(false);

    await program.parseAsync(['node', 'envault', 'info']);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle load errors gracefully', async () => {
    mockExistsSync.mockReturnValue(true);
    mockLoadVault.mockRejectedValue(new Error('corrupt vault'));

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await program.parseAsync(['node', 'envault', 'info']);

    expect(exitSpy).toHaveBeenCalledWith(1);
    errorSpy.mockRestore();
  });
});
