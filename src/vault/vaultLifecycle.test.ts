import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getLifecyclePath,
  loadLifecycleStore,
  setLifecycleStage,
  removeLifecycleEntry,
  getLifecycleEntry,
  listKeysByStage,
  formatLifecycleSummary,
} from './vaultLifecycle';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-lifecycle-'));
}

describe('vaultLifecycle', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty store when file does not exist', () => {
    expect(loadLifecycleStore(tmpDir)).toEqual({});
  });

  it('getLifecyclePath returns correct path', () => {
    expect(getLifecyclePath(tmpDir)).toContain('lifecycle.json');
  });

  it('sets and retrieves a lifecycle stage', () => {
    setLifecycleStage(tmpDir, 'API_KEY', 'active');
    const entry = getLifecycleEntry(tmpDir, 'API_KEY');
    expect(entry).toBeDefined();
    expect(entry!.stage).toBe('active');
    expect(entry!.updatedAt).toBeTruthy();
  });

  it('sets lifecycle stage with reason', () => {
    setLifecycleStage(tmpDir, 'DB_PASS', 'deprecated', 'Use DB_PASSWORD instead');
    const entry = getLifecycleEntry(tmpDir, 'DB_PASS');
    expect(entry!.reason).toBe('Use DB_PASSWORD instead');
  });

  it('removes a lifecycle entry', () => {
    setLifecycleStage(tmpDir, 'SECRET', 'draft');
    removeLifecycleEntry(tmpDir, 'SECRET');
    expect(getLifecycleEntry(tmpDir, 'SECRET')).toBeUndefined();
  });

  it('lists keys by stage', () => {
    setLifecycleStage(tmpDir, 'KEY_A', 'active');
    setLifecycleStage(tmpDir, 'KEY_B', 'archived');
    setLifecycleStage(tmpDir, 'KEY_C', 'active');
    const active = listKeysByStage(tmpDir, 'active');
    expect(active).toContain('KEY_A');
    expect(active).toContain('KEY_C');
    expect(active).not.toContain('KEY_B');
  });

  it('formats lifecycle summary', () => {
    setLifecycleStage(tmpDir, 'TOKEN', 'active', 'in use');
    const store = loadLifecycleStore(tmpDir);
    const summary = formatLifecycleSummary(store);
    expect(summary).toContain('TOKEN');
    expect(summary).toContain('active');
    expect(summary).toContain('in use');
  });

  it('returns no-entries message for empty store', () => {
    expect(formatLifecycleSummary({})).toBe('No lifecycle stages assigned.');
  });
});
