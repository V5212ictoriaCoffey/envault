import { Command } from 'commander';
import path from 'path';
import {
  addLabel,
  removeLabel,
  getLabels,
  getKeysByLabel,
  clearLabels,
} from '../../vault/vaultLabel';

export function registerLabelCommand(program: Command): void {
  const label = program
    .command('label')
    .description('Manage labels for vault keys');

  label
    .command('add <key> <label>')
    .description('Add a label to a vault key')
    .option('--vault-dir <dir>', 'Vault directory', process.cwd())
    .action((key: string, labelValue: string, opts: { vaultDir: string }) => {
      const vaultDir = path.resolve(opts.vaultDir);
      addLabel(vaultDir, key, labelValue);
      console.log(`Label "${labelValue}" added to key "${key}".`);
    });

  label
    .command('remove <key> <label>')
    .description('Remove a label from a vault key')
    .option('--vault-dir <dir>', 'Vault directory', process.cwd())
    .action((key: string, labelValue: string, opts: { vaultDir: string }) => {
      const vaultDir = path.resolve(opts.vaultDir);
      removeLabel(vaultDir, key, labelValue);
      console.log(`Label "${labelValue}" removed from key "${key}".`);
    });

  label
    .command('list <key>')
    .description('List all labels for a vault key')
    .option('--vault-dir <dir>', 'Vault directory', process.cwd())
    .action((key: string, opts: { vaultDir: string }) => {
      const vaultDir = path.resolve(opts.vaultDir);
      const labels = getLabels(vaultDir, key);
      if (labels.length === 0) {
        console.log(`No labels found for key "${key}".`);
      } else {
        console.log(`Labels for "${key}": ${labels.join(', ')}`);
      }
    });

  label
    .command('search <label>')
    .description('Find all keys with a given label')
    .option('--vault-dir <dir>', 'Vault directory', process.cwd())
    .action((labelValue: string, opts: { vaultDir: string }) => {
      const vaultDir = path.resolve(opts.vaultDir);
      const keys = getKeysByLabel(vaultDir, labelValue);
      if (keys.length === 0) {
        console.log(`No keys found with label "${labelValue}".`);
      } else {
        console.log(`Keys with label "${labelValue}":\n${keys.map((k) => `  - ${k}`).join('\n')}`);
      }
    });

  label
    .command('clear <key>')
    .description('Remove all labels from a vault key')
    .option('--vault-dir <dir>', 'Vault directory', process.cwd())
    .action((key: string, opts: { vaultDir: string }) => {
      const vaultDir = path.resolve(opts.vaultDir);
      clearLabels(vaultDir, key);
      console.log(`All labels cleared from key "${key}".`);
    });
}
