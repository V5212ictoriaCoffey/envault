import { Command } from 'commander';
import {
  markSecret,
  unmarkSecret,
  listSecretKeys,
  getSecretMetadata,
} from '../../vault/vaultSecret';

export function registerSecretCommand(program: Command): void {
  const secret = program
    .command('secret')
    .description('Manage secret metadata for vault keys');

  secret
    .command('mark <key>')
    .description('Mark a vault key as secret')
    .option('--no-mask', 'Disable value masking')
    .option('--no-redact', 'Disable log redaction')
    .option('--share <users>', 'Comma-separated list of users who can access this secret')
    .action((key: string, opts) => {
      const vaultDir = process.cwd();
      const shareableWith = opts.share
        ? (opts.share as string).split(',').map((u: string) => u.trim())
        : [];
      markSecret(vaultDir, key, {
        masked: opts.mask !== false,
        redactInLogs: opts.redact !== false,
        shareableWith,
      });
      console.log(`✔ Marked "${key}" as secret.`);
    });

  secret
    .command('unmark <key>')
    .description('Remove secret metadata from a vault key')
    .action((key: string) => {
      const vaultDir = process.cwd();
      unmarkSecret(vaultDir, key);
      console.log(`✔ Removed secret metadata from "${key}".`);
    });

  secret
    .command('list')
    .description('List all keys marked as secret')
    .action(() => {
      const vaultDir = process.cwd();
      const keys = listSecretKeys(vaultDir);
      if (keys.length === 0) {
        console.log('No keys marked as secret.');
        return;
      }
      console.log('Secret keys:');
      keys.forEach((k) => console.log(`  - ${k}`));
    });

  secret
    .command('info <key>')
    .description('Show secret metadata for a key')
    .action((key: string) => {
      const vaultDir = process.cwd();
      const meta = getSecretMetadata(vaultDir, key);
      if (!meta) {
        console.log(`"${key}" is not marked as secret.`);
        return;
      }
      console.log(`Key:           ${meta.key}`);
      console.log(`Masked:        ${meta.masked}`);
      console.log(`Redact in logs:${meta.redactInLogs}`);
      console.log(`Shareable with:${meta.shareableWith.join(', ') || 'none'}`);
    });
}
