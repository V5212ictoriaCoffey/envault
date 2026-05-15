import { Command } from 'commander';
import * as path from 'path';
import { loadVault, decryptVault } from '../../vault/vault';
import { loadKey } from '../../crypto/keyPair';
import { validateVaultEntries, formatValidationReport, saveValidationRules, loadValidationRules } from '../../vault/vaultValidation';

export function registerValidateCommand(program: Command): void {
  const validate = program
    .command('validate')
    .description('Validate vault entries against format and custom rules');

  validate
    .command('run')
    .description('Run validation against all decrypted vault entries')
    .option('--vault <path>', 'Path to vault file', '.envault/vault.json')
    .option('--key <path>', 'Path to private key', '.envault/private.pem')
    .action(async (opts) => {
      try {
        const vaultDir = path.dirname(path.resolve(opts.vault));
        const vault = await loadVault(opts.vault);
        const privateKey = await loadKey(opts.key);
        const decrypted = await decryptVault(vault, privateKey);
        const report = await validateVaultEntries(vaultDir, decrypted);
        console.log(formatValidationReport(report));
        if (report.failed.length > 0) {
          process.exitCode = 1;
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  validate
    .command('set-rule <key>')
    .description('Set a validation rule for a key')
    .option('--vault <path>', 'Path to vault directory', '.envault')
    .option('--min-length <n>', 'Minimum value length')
    .option('--max-length <n>', 'Maximum value length')
    .option('--pattern <regex>', 'Regex pattern the value must match')
    .action(async (key, opts) => {
      try {
        const vaultDir = path.resolve(opts.vault);
        const rules = await loadValidationRules(vaultDir);
        rules[key] = {
          ...(opts.minLength !== undefined && { minLength: parseInt(opts.minLength, 10) }),
          ...(opts.maxLength !== undefined && { maxLength: parseInt(opts.maxLength, 10) }),
          ...(opts.pattern !== undefined && { pattern: opts.pattern }),
        };
        await saveValidationRules(vaultDir, rules);
        console.log(`Validation rule set for "${key}"`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  validate
    .command('remove-rule <key>')
    .description('Remove a validation rule for a key')
    .option('--vault <path>', 'Path to vault directory', '.envault')
    .action(async (key, opts) => {
      try {
        const vaultDir = path.resolve(opts.vault);
        const rules = await loadValidationRules(vaultDir);
        delete rules[key];
        await saveValidationRules(vaultDir, rules);
        console.log(`Validation rule removed for "${key}"`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
