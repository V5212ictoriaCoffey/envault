import { Command } from 'commander';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { registerSensitivityCommand } from './sensitivity';
import { setSensitivity, getSensitivity } from '../../vault/vaultSensitivity';

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'envault-sensitivity-test-'));
}

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerSensitivityCommand(program);
  return program;
}

describe('sensitivity command', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await makeTempDir();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('sets a sensitivity level for a key', async () => {
    const program = buildProgram();
    await program.parseAsync(['sensitivity', 'set', 'API_KEY', 'secret', '--dir', tmpDir], { from: 'user' });
    const level = await getSensitivity(tmpDir, 'API_KEY');
    expect(level).toBe('secret');
  });

  it('gets the sensitivity level for a key', async () => {
    await setSensitivity(tmpDir, 'DB_PASS', 'confidential');
    const program = buildProgram();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['sensitivity', 'get', 'DB_PASS', '--dir', tmpDir], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('confidential'));
    spy.mockRestore();
  });

  it('reports no sensitivity when key is unclassified', async () => {
    const program = buildProgram();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['sensitivity', 'get', 'UNKNOWN_KEY', '--dir', tmpDir], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No sensitivity'));
    spy.mockRestore();
  });

  it('removes a sensitivity classification', async () => {
    await setSensitivity(tmpDir, 'TOKEN', 'internal');
    const program = buildProgram();
    await program.parseAsync(['sensitivity', 'remove', 'TOKEN', '--dir', tmpDir], { from: 'user' });
    const level = await getSensitivity(tmpDir, 'TOKEN');
    expect(level).toBeNull();
  });

  it('lists all sensitivity classifications', async () => {
    await setSensitivity(tmpDir, 'KEY_A', 'public');
    await setSensitivity(tmpDir, 'KEY_B', 'secret');
    const program = buildProgram();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['sensitivity', 'list', '--dir', tmpDir], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('KEY_A'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('KEY_B'));
    spy.mockRestore();
  });

  it('rejects an invalid sensitivity level', async () => {
    const program = buildProgram();
    const spy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      program.parseAsync(['sensitivity', 'set', 'KEY', 'ultra-secret', '--dir', tmpDir], { from: 'user' })
    ).rejects.toThrow();
    spy.mockRestore();
  });
});
