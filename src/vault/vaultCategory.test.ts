import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getCategoryPath,
  loadCategoryStore,
  addKeyToCategory,
  removeKeyFromCategory,
  getKeysInCategory,
  getCategoriesForKey,
  listCategories,
  deleteCategory,
} from './vaultCategory';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-category-'));
}

describe('vaultCategory', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('getCategoryPath returns correct path', () => {
    expect(getCategoryPath(tmpDir)).toBe(path.join(tmpDir, '.envault-categories.json'));
  });

  it('loadCategoryStore returns empty store when file does not exist', () => {
    const store = loadCategoryStore(tmpDir);
    expect(store).toEqual({ categories: {} });
  });

  it('addKeyToCategory adds a key to a new category', () => {
    addKeyToCategory(tmpDir, 'database', 'DB_HOST');
    const keys = getKeysInCategory(tmpDir, 'database');
    expect(keys).toContain('DB_HOST');
  });

  it('addKeyToCategory does not duplicate keys', () => {
    addKeyToCategory(tmpDir, 'database', 'DB_HOST');
    addKeyToCategory(tmpDir, 'database', 'DB_HOST');
    const keys = getKeysInCategory(tmpDir, 'database');
    expect(keys.filter(k => k === 'DB_HOST').length).toBe(1);
  });

  it('removeKeyFromCategory removes a key', () => {
    addKeyToCategory(tmpDir, 'database', 'DB_HOST');
    addKeyToCategory(tmpDir, 'database', 'DB_PORT');
    removeKeyFromCategory(tmpDir, 'database', 'DB_HOST');
    expect(getKeysInCategory(tmpDir, 'database')).not.toContain('DB_HOST');
    expect(getKeysInCategory(tmpDir, 'database')).toContain('DB_PORT');
  });

  it('removeKeyFromCategory deletes category when empty', () => {
    addKeyToCategory(tmpDir, 'database', 'DB_HOST');
    removeKeyFromCategory(tmpDir, 'database', 'DB_HOST');
    expect(listCategories(tmpDir)).not.toContain('database');
  });

  it('getCategoriesForKey returns all categories containing the key', () => {
    addKeyToCategory(tmpDir, 'database', 'DB_HOST');
    addKeyToCategory(tmpDir, 'infra', 'DB_HOST');
    const cats = getCategoriesForKey(tmpDir, 'DB_HOST');
    expect(cats).toContain('database');
    expect(cats).toContain('infra');
  });

  it('listCategories returns all category names', () => {
    addKeyToCategory(tmpDir, 'auth', 'JWT_SECRET');
    addKeyToCategory(tmpDir, 'database', 'DB_URL');
    expect(listCategories(tmpDir)).toEqual(expect.arrayContaining(['auth', 'database']));
  });

  it('deleteCategory removes the entire category', () => {
    addKeyToCategory(tmpDir, 'auth', 'JWT_SECRET');
    deleteCategory(tmpDir, 'auth');
    expect(listCategories(tmpDir)).not.toContain('auth');
  });
});
