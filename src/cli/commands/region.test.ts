import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerRegionCommand } from './region';
import { setRegion } from '../../vault/vaultRegion';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-region-cmd-'));
}

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerRegionCommand(program);
  return program;
}

describe('region command', () => {
  let tmpDir: string;
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    tmpDir = makeTempDir();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('sets a region for a key', () => {
    const program = buildProgram();
    program.parse(['region', 'set', 'API_KEY', 'us-east-1', '--dir', tmpDir], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('us-east-1'));
  });

  it('errors on invalid region', () => {
    const program = buildProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() =>
      program.parse(['region', 'set', 'API_KEY', 'bad-region', '--dir', tmpDir], { from: 'user' })
    ).toThrow();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid region'));
    exitSpy.mockRestore();
  });

  it('gets a region for a key', () => {
    setRegion(tmpDir, 'DB_URL', 'eu-central-1');
    const program = buildProgram();
    program.parse(['region', 'get', 'DB_URL', '--dir', tmpDir], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('eu-central-1'));
  });

  it('reports no region for unknown key', () => {
    const program = buildProgram();
    program.parse(['region', 'get', 'UNKNOWN', '--dir', tmpDir], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No region set'));
  });

  it('removes a region', () => {
    setRegion(tmpDir, 'SECRET', 'global');
    const program = buildProgram();
    program.parse(['region', 'remove', 'SECRET', '--dir', tmpDir], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('removed'));
  });

  it('lists all regions', () => {
    setRegion(tmpDir, 'KEY_A', 'ap-southeast-1');
    const program = buildProgram();
    program.parse(['region', 'list', '--dir', tmpDir], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ap-southeast-1'));
  });

  it('lists valid regions', () => {
    const program = buildProgram();
    program.parse(['region', 'valid'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Valid regions'));
  });
});
