import * as fs from 'fs';
import * as path from 'path';

export interface CategoryStore {
  categories: Record<string, string[]>; // category -> list of keys
}

export function getCategoryPath(vaultDir: string): string {
  return path.join(vaultDir, '.envault-categories.json');
}

export function loadCategoryStore(vaultDir: string): CategoryStore {
  const filePath = getCategoryPath(vaultDir);
  if (!fs.existsSync(filePath)) {
    return { categories: {} };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as CategoryStore;
}

export function saveCategoryStore(vaultDir: string, store: CategoryStore): void {
  const filePath = getCategoryPath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function addKeyToCategory(vaultDir: string, category: string, key: string): void {
  const store = loadCategoryStore(vaultDir);
  if (!store.categories[category]) {
    store.categories[category] = [];
  }
  if (!store.categories[category].includes(key)) {
    store.categories[category].push(key);
  }
  saveCategoryStore(vaultDir, store);
}

export function removeKeyFromCategory(vaultDir: string, category: string, key: string): void {
  const store = loadCategoryStore(vaultDir);
  if (!store.categories[category]) return;
  store.categories[category] = store.categories[category].filter(k => k !== key);
  if (store.categories[category].length === 0) {
    delete store.categories[category];
  }
  saveCategoryStore(vaultDir, store);
}

export function getKeysInCategory(vaultDir: string, category: string): string[] {
  const store = loadCategoryStore(vaultDir);
  return store.categories[category] ?? [];
}

export function getCategoriesForKey(vaultDir: string, key: string): string[] {
  const store = loadCategoryStore(vaultDir);
  return Object.entries(store.categories)
    .filter(([, keys]) => keys.includes(key))
    .map(([cat]) => cat);
}

export function listCategories(vaultDir: string): string[] {
  const store = loadCategoryStore(vaultDir);
  return Object.keys(store.categories);
}

export function deleteCategory(vaultDir: string, category: string): void {
  const store = loadCategoryStore(vaultDir);
  delete store.categories[category];
  saveCategoryStore(vaultDir, store);
}
