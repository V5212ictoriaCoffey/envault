import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerLinkedCommand } from './linked';
import { getAllLinks } from '../../vault/vaultLinked';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-linked-cli-'));
}

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerLinkedCommand(program);
  return program;
}

describe('linked command', () => {
  it('linked add creates a link', () => {
    const dir = makeTempDir();
    const program = buildProgram();
    program.parse(['linked', 'add', 'DB_HOST', 'DB_REPLICA', '--vault-dir', dir], { from: 'user' });
    const links = getAllLinks(dir);
    expect(links).toHaveLength(1);
    expect(links[0].sourceKey).toBe('DB_HOST');
    expect(links[0].targetKey).toBe('DB_REPLICA');
  });

  it('linked add supports --description flag', () => {
    const dir = makeTempDir();
    const program = buildProgram();
    program.parse(
      ['linked', 'add', 'A', 'B', '--description', 'test link', '--vault-dir', dir],
      { from: 'user' }
    );
    const links = getAllLinks(dir);
    expect(links[0].description).toBe('test link');
  });

  it('linked remove removes a link', () => {
    const dir = makeTempDir();
    const program = buildProgram();
    program.parse(['linked', 'add', 'X', 'Y', '--vault-dir', dir], { from: 'user' });
    program.parse(['linked', 'remove', 'X', 'Y', '--vault-dir', dir], { from: 'user' });
    expect(getAllLinks(dir)).toHaveLength(0);
  });

  it('linked list prints no links message when empty', () => {
    const dir = makeTempDir();
    const program = buildProgram();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['linked', 'list', '--vault-dir', dir], { from: 'user' });
    expect(spy).toHaveBeenCalledWith('No links found.');
    spy.mockRestore();
  });

  it('linked list shows all links', () => {
    const dir = makeTempDir();
    const program = buildProgram();
    program.parse(['linked', 'add', 'A', 'B', '--vault-dir', dir], { from: 'user' });
    program.parse(['linked', 'add', 'C', 'D', '--vault-dir', dir], { from: 'user' });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['linked', 'list', '--vault-dir', dir], { from: 'user' });
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });

  it('linked list [key] filters by key', () => {
    const dir = makeTempDir();
    const program = buildProgram();
    program.parse(['linked', 'add', 'DB_HOST', 'DB_REPLICA', '--vault-dir', dir], { from: 'user' });
    program.parse(['linked', 'add', 'REDIS_URL', 'CACHE_URL', '--vault-dir', dir], { from: 'user' });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['linked', 'list', 'DB_HOST', '--vault-dir', dir], { from: 'user' });
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
