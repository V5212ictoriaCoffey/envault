import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import {
  loadValidationRules,
  saveValidationRules,
  validateVaultEntries,
  formatValidationReport,
  getValidationPath,
} from './vaultValidation';
import { setFormat } from './vaultFormat';

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'envault-validation-'));
}

describe('vaultValidation', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await makeTempDir();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('returns empty rules when no file exists', async () => {
    const rules = await loadValidationRules(tmpDir);
    expect(rules).toEqual({});
  });

  it('saves and loads validation rules', async () => {
    await saveValidationRules(tmpDir, { API_KEY: { required: true, minLength: 8 } });
    const rules = await loadValidationRules(tmpDir);
    expect(rules.API_KEY).toEqual({ required: true, minLength: 8 });
  });

  it('skips keys with no format or rule', async () => {
    const report = await validateVaultEntries(tmpDir, { UNKNOWN_KEY: 'value' });
    expect(report.skipped).toContain('UNKNOWN_KEY');
    expect(report.passed).toHaveLength(0);
    expect(report.failed).toHaveLength(0);
  });

  it('passes valid entries against format', async () => {
    await setFormat(tmpDir, 'PORT', 'number');
    const report = await validateVaultEntries(tmpDir, { PORT: '3000' });
    expect(report.passed).toHaveLength(1);
    expect(report.passed[0].key).toBe('PORT');
  });

  it('fails invalid format entries', async () => {
    await setFormat(tmpDir, 'PORT', 'number');
    const report = await validateVaultEntries(tmpDir, { PORT: 'not-a-number' });
    expect(report.failed).toHaveLength(1);
    expect(report.failed[0].key).toBe('PORT');
  });

  it('fails entries violating minLength rule', async () => {
    await saveValidationRules(tmpDir, { SECRET: { minLength: 16 } });
    const report = await validateVaultEntries(tmpDir, { SECRET: 'short' });
    expect(report.failed[0].key).toBe('SECRET');
    expect(report.failed[0].message).toMatch(/minimum length/);
  });

  it('fails entries violating pattern rule', async () => {
    await saveValidationRules(tmpDir, { EMAIL: { pattern: '^[\\w.]+@[\\w]+\\.[a-z]+$' } });
    const report = await validateVaultEntries(tmpDir, { EMAIL: 'not-an-email' });
    expect(report.failed[0].key).toBe('EMAIL');
  });

  it('formats a validation report with passed and failed', async () => {
    await setFormat(tmpDir, 'PORT', 'number');
    await setFormat(tmpDir, 'HOST', 'url');
    const report = await validateVaultEntries(tmpDir, { PORT: '8080', HOST: 'not-a-url' });
    const output = formatValidationReport(report);
    expect(output).toMatch(/Passed/);
    expect(output).toMatch(/Failed/);
    expect(output).toMatch(/HOST/);
  });
});
