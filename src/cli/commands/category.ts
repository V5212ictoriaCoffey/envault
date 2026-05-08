import { Command } from 'commander';
import {
  addKeyToCategory,
  removeKeyFromCategory,
  getKeysInCategory,
  getCategoriesForKey,
  listCategories,
  deleteCategory,
} from '../../vault/vaultCategory';

export function registerCategoryCommand(program: Command): void {
  const category = program
    .command('category')
    .description('Manage key categories in the vault');

  category
    .command('add <category> <key>')
    .description('Add a key to a category')
    .option('--vault-dir <dir>', 'Vault directory', process.cwd())
    .action((cat: string, key: string, opts: { vaultDir: string }) => {
      addKeyToCategory(opts.vaultDir, cat, key);
      console.log(`Added "${key}" to category "${cat}".`);
    });

  category
    .command('remove <category> <key>')
    .description('Remove a key from a category')
    .option('--vault-dir <dir>', 'Vault directory', process.cwd())
    .action((cat: string, key: string, opts: { vaultDir: string }) => {
      removeKeyFromCategory(opts.vaultDir, cat, key);
      console.log(`Removed "${key}" from category "${cat}".`);
    });

  category
    .command('list [category]')
    .description('List categories or keys in a category')
    .option('--vault-dir <dir>', 'Vault directory', process.cwd())
    .action((cat: string | undefined, opts: { vaultDir: string }) => {
      if (cat) {
        const keys = getKeysInCategory(opts.vaultDir, cat);
        if (keys.length === 0) {
          console.log(`No keys in category "${cat}".`);
        } else {
          console.log(`Keys in "${cat}":\n` + keys.map(k => `  - ${k}`).join('\n'));
        }
      } else {
        const cats = listCategories(opts.vaultDir);
        if (cats.length === 0) {
          console.log('No categories defined.');
        } else {
          console.log('Categories:\n' + cats.map(c => `  - ${c}`).join('\n'));
        }
      }
    });

  category
    .command('of <key>')
    .description('Show all categories a key belongs to')
    .option('--vault-dir <dir>', 'Vault directory', process.cwd())
    .action((key: string, opts: { vaultDir: string }) => {
      const cats = getCategoriesForKey(opts.vaultDir, key);
      if (cats.length === 0) {
        console.log(`"${key}" is not in any category.`);
      } else {
        console.log(`Categories for "${key}":\n` + cats.map(c => `  - ${c}`).join('\n'));
      }
    });

  category
    .command('delete <category>')
    .description('Delete an entire category')
    .option('--vault-dir <dir>', 'Vault directory', process.cwd())
    .action((cat: string, opts: { vaultDir: string }) => {
      deleteCategory(opts.vaultDir, cat);
      console.log(`Deleted category "${cat}".`);
    });
}
