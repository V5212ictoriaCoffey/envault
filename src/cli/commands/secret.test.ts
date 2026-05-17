import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerSecretCommand } from './secret';
import { markSecret, isSecret, listSecretKeys } from '../../vault/vaultSecret';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-secret-cmd-'));
}

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerSecretCommand(program);
  return program;
}

describe('secret command', () => {
  let dir: string;
  let cwd: string;

  beforeEach(() => {
    dir = makeTempDir();
    cwd = process.cwd();
    process.chdir(dir);
  });

  afterEach(() => {
    process.chdir(cwd);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('mark command stores secret metadata', () => {
    const program = buildProgram();
    program.parse(['node', 'envault', 'secret', 'mark', 'DB_PASSWORD']);
    expect(isSecret(dir, 'DB_PASSWORD')).toBe(true);
  });

  it('mark command with --share option sets shareableWith', () => {
    const program = buildProgram();
    program.parse(['node', 'envault', 'secret', 'mark', 'API_KEY', '--share', 'alice,bob']);
    const { getSecretMetadata } = require('../../vault/vaultSecret');
    const meta = getSecretMetadata(dir, 'API_KEY');
    expect(meta?.shareableWith).toEqual(['alice', 'bob']);
  });

  it('unmark command removes secret metadata', () => {
    markSecret(dir, 'TOKEN');
    const program = buildProgram();
    program.parse(['node', 'envault', 'secret', 'unmark', 'TOKEN']);
    expect(isSecret(dir, 'TOKEN')).toBe(false);
  });

  it('list command outputs all secret keys', () => {
    markSecret(dir, 'KEY_ONE');
    markSecret(dir, 'KEY_TWO');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    program.parse(['node', 'envault', 'secret', 'list']);
    const output = spy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('KEY_ONE');
    expect(output).toContain('KEY_TWO');
    spy.mockRestore();
  });

  it('list command shows message when no secrets exist', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    program.parse(['node', 'envault', 'secret', 'list']);
    expect(spy.mock.calls[0][0]).toMatch(/No keys marked/);
    spy.mockRestore();
  });

  it('info command displays metadata for a secret key', () => {
    markSecret(dir, 'PRIVATE_KEY', { shareableWith: ['carol'] });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    program.parse(['node', 'envault', 'secret', 'info', 'PRIVATE_KEY']);
    const output = spy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('PRIVATE_KEY');
    expect(output).toContain('carol');
    spy.mockRestore();
  });

  it('info command shows not-secret message for unknown key', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    program.parse(['node', 'envault', 'secret', 'info', 'UNKNOWN']);
    expect(spy.mock.calls[0][0]).toMatch(/not marked as secret/);
    spy.mockRestore();
  });
});
