import { Command } from 'commander';
import path from 'path';
import {
  setSensitivity,
  removeSensitivity,
  getSensitivity,
  getKeysBySensitivity,
  loadSensitivityStore,
  SensitivityLevel,
} from '../../vault/vaultSensitivity';

const LEVELS: SensitivityLevel[] = ['public', 'internal', 'confidential', 'secret'];

export function registerSensitivityCommand(program: Command): void {
  const sensitivity = program
    .command('sensitivity')
    .description('Manage sensitivity levels for vault keys');

  sensitivity
    .command('set <key> <level>')
    .description(`Set sensitivity level for a key (${LEVELS.join(', ')})`)
    .option('-d, --dir <dir>', 'Vault directory', process.cwd())
    .action(async (key: string, level: string, opts: { dir: string }) => {
      if (!LEVELS.includes(level as SensitivityLevel)) {
        console.error(`Invalid level "${level}". Must be one of: ${LEVELS.join(', ')}`);
        process.exit(1);
      }
      const vaultDir = path.resolve(opts.dir);
      await setSensitivity(vaultDir, key, level as SensitivityLevel);
      console.log(`Set sensitivity of "${key}" to "${level}".`);
    });

  sensitivity
    .command('get <key>')
    .description('Get sensitivity level for a key')
    .option('-d, --dir <dir>', 'Vault directory', process.cwd())
    .action(async (key: string, opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      const level = await getSensitivity(vaultDir, key);
      if (level === null) {
        console.log(`No sensitivity set for "${key}".`);
      } else {
        console.log(`${key}: ${level}`);
      }
    });

  sensitivity
    .command('remove <key>')
    .description('Remove sensitivity classification from a key')
    .option('-d, --dir <dir>', 'Vault directory', process.cwd())
    .action(async (key: string, opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      await removeSensitivity(vaultDir, key);
      console.log(`Removed sensitivity classification from "${key}".`);
    });

  sensitivity
    .command('list')
    .description('List all keys with their sensitivity levels')
    .option('-d, --dir <dir>', 'Vault directory', process.cwd())
    .option('-l, --level <level>', 'Filter by sensitivity level')
    .action(async (opts: { dir: string; level?: string }) => {
      const vaultDir = path.resolve(opts.dir);
      if (opts.level) {
        if (!LEVELS.includes(opts.level as SensitivityLevel)) {
          console.error(`Invalid level "${opts.level}". Must be one of: ${LEVELS.join(', ')}`);
          process.exit(1);
        }
        const keys = await getKeysBySensitivity(vaultDir, opts.level as SensitivityLevel);
        if (keys.length === 0) {
          console.log(`No keys with sensitivity "${opts.level}".`);
        } else {
          keys.forEach((k) => console.log(`  ${k}`));
        }
      } else {
        const store = await loadSensitivityStore(vaultDir);
        const entries = Object.entries(store);
        if (entries.length === 0) {
          console.log('No sensitivity classifications set.');
        } else {
          entries.forEach(([k, v]) => console.log(`  ${k}: ${v}`));
        }
      }
    });
}
