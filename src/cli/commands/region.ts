import { Command } from 'commander';
import * as path from 'path';
import {
  setRegion,
  removeRegion,
  getRegion,
  listRegions,
  getValidRegions
} from '../../vault/vaultRegion';

export function registerRegionCommand(program: Command): void {
  const region = program
    .command('region')
    .description('Manage deployment region tags for vault keys');

  region
    .command('set <key> <region>')
    .description('Assign a deployment region to a vault key')
    .option('-d, --dir <dir>', 'Vault directory', process.cwd())
    .action((key: string, regionValue: string, opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      try {
        setRegion(vaultDir, key, regionValue);
        console.log(`Region '${regionValue}' assigned to key '${key}'.`);
      } catch (err: any) {
        console.error(err.message);
        process.exit(1);
      }
    });

  region
    .command('get <key>')
    .description('Get the region assigned to a vault key')
    .option('-d, --dir <dir>', 'Vault directory', process.cwd())
    .action((key: string, opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      const value = getRegion(vaultDir, key);
      if (value) {
        console.log(`${key}: ${value}`);
      } else {
        console.log(`No region set for key '${key}'.`);
      }
    });

  region
    .command('remove <key>')
    .description('Remove the region tag from a vault key')
    .option('-d, --dir <dir>', 'Vault directory', process.cwd())
    .action((key: string, opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      removeRegion(vaultDir, key);
      console.log(`Region removed from key '${key}'.`);
    });

  region
    .command('list')
    .description('List all keys with assigned regions')
    .option('-d, --dir <dir>', 'Vault directory', process.cwd())
    .action((opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      const store = listRegions(vaultDir);
      const entries = Object.entries(store);
      if (entries.length === 0) {
        console.log('No region assignments found.');
      } else {
        entries.forEach(([k, v]) => console.log(`  ${k}: ${v}`));
      }
    });

  region
    .command('valid')
    .description('List all valid region identifiers')
    .action(() => {
      console.log('Valid regions:');
      getValidRegions().forEach(r => console.log(`  - ${r}`));
    });
}
