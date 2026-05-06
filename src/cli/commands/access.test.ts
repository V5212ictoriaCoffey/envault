import { Command } from 'commander';
import * as vaultAccess from '../../vault/vaultAccess';
import * as fs from 'fs';
import { registerAccessCommand } from './access';

jest.mock('../../vault/vaultAccess');
jest.mock('fs');

const mockLoadAccessList = vaultAccess.loadAccessList as jest.Mock;
const mockSaveAccessList = vaultAccess.saveAccessList as jest.Mock;
const mockAddAccessEntry = vaultAccess.addAccessEntry as jest.Mock;
const mockRemoveAccessEntry = vaultAccess.removeAccessEntry as jest.Mock;
const mockExistsSync = fs.existsSync as jest.Mock;

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerAccessCommand(program);
  return program;
}

describe('access command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
  });

  test('grant adds entry and saves list', () => {
    mockExistsSync.mockReturnValue(true);
    const fakeList = { entries: [] };
    const updatedList = { entries: [{ alias: 'alice', publicKeyPath: '/k/alice.pub', addedAt: '2024-01-01T00:00:00.000Z' }] };
    mockLoadAccessList.mockReturnValue(fakeList);
    mockAddAccessEntry.mockReturnValue(updatedList);

    const program = buildProgram();
    program.parse(['access', 'grant', 'alice', '/k/alice.pub'], { from: 'user' });

    expect(mockAddAccessEntry).toHaveBeenCalledWith(fakeList, 'alice', '/k/alice.pub');
    expect(mockSaveAccessList).toHaveBeenCalledWith(updatedList);
  });

  test('grant exits if public key file does not exist', () => {
    mockExistsSync.mockReturnValue(false);
    const program = buildProgram();
    expect(() =>
      program.parse(['access', 'grant', 'alice', '/missing.pub'], { from: 'user' })
    ).toThrow('process.exit');
  });

  test('revoke removes entry and saves list', () => {
    const fakeList = { entries: [{ alias: 'alice', publicKeyPath: '/k/alice.pub', addedAt: '2024-01-01T00:00:00.000Z' }] };
    const updatedList = { entries: [] };
    mockLoadAccessList.mockReturnValue(fakeList);
    mockRemoveAccessEntry.mockReturnValue(updatedList);

    const program = buildProgram();
    program.parse(['access', 'revoke', 'alice'], { from: 'user' });

    expect(mockRemoveAccessEntry).toHaveBeenCalledWith(fakeList, 'alice');
    expect(mockSaveAccessList).toHaveBeenCalledWith(updatedList);
  });

  test('revoke exits on error', () => {
    mockLoadAccessList.mockReturnValue({ entries: [] });
    mockRemoveAccessEntry.mockImplementation(() => { throw new Error('not found'); });

    const program = buildProgram();
    expect(() =>
      program.parse(['access', 'revoke', 'ghost'], { from: 'user' })
    ).toThrow('process.exit');
  });

  test('list prints entries', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockLoadAccessList.mockReturnValue({
      entries: [{ alias: 'bob', publicKeyPath: '/k/bob.pub', addedAt: '2024-06-01T00:00:00.000Z' }],
    });
    const program = buildProgram();
    program.parse(['access', 'list'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('bob'));
    consoleSpy.mockRestore();
  });

  test('list prints empty message when no entries', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockLoadAccessList.mockReturnValue({ entries: [] });
    const program = buildProgram();
    program.parse(['access', 'list'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No team members'));
    consoleSpy.mockRestore();
  });
});
