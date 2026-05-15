import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { registerValidateCommand } from './validate';
import { saveValidationRules, loadValidationRules } from '../../vault/vaultValidation';

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'envault-validate-cmd-'));
}

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerValidateCommand(program);
  return program;
}

describe('validate command', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await makeTempDir();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('registers validate subcommands', () => {
    const program = buildProgram();
    const names = program.commands.map(c => c.name());
    expect(names).toContain('validate');
  });

  it('set-rule creates a validation rule', async () => {
    const program = buildProgram();
    await program.parseAsync([
      'node', 'envault',
      'validate', 'set-rule', 'API_KEY',
      '--vault', tmpDir,
      '--min-length', '16',
    ]);
    const rules = await loadValidationRules(tmpDir);
    expect(rules.API_KEY).toEqual({ minLength: 16 });
  });

  it('set-rule supports pattern option', async () => {
    const program = buildProgram();
    await program.parseAsync([
      'node', 'envault',
      'validate', 'set-rule', 'EMAIL',
      '--vault', tmpDir,
      '--pattern', '^[\\w]+@[\\w]+\\.com$',
    ]);
    const rules = await loadValidationRules(tmpDir);
    expect(rules.EMAIL.pattern).toBe('^[\\w]+@[\\w]+\\.com$');
  });

  it('remove-rule deletes an existing rule', async () => {
    await saveValidationRules(tmpDir, { SECRET: { minLength: 8 } });
    const program = buildProgram();
    await program.parseAsync([
      'node', 'envault',
      'validate', 'remove-rule', 'SECRET',
      '--vault', tmpDir,
    ]);
    const rules = await loadValidationRules(tmpDir);
    expect(rules.SECRET).toBeUndefined();
  });

  it('remove-rule on non-existent key does not throw', async () => {
    const program = buildProgram();
    await expect(
      program.parseAsync([
        'node', 'envault',
        'validate', 'remove-rule', 'GHOST',
        '--vault', tmpDir,
      ])
    ).resolves.not.toThrow();
  });
});
