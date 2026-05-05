import { Command } from 'commander';
import * as path from 'path';
import { loadVault, saveVault } from '../../vault';

const DEFAULT_VAULT_PATH = '.envault';

export function registerRemoveCommand(program: Command): void {
  program
    .command('remove <key>')
    .alias('rm')
    .description('Remove an encrypted key from the vault')
    .option('-v, --vault <path>', 'Path to vault file', DEFAULT_VAULT_PATH)
    .option('-f, --force', 'Skip confirmation prompt', false)
    .action(async (key: string, options) => {
      try {
        const vaultPath = path.resolve(options.vault);
        const vault = await loadVault(vaultPath);

        if (!(key in vault.entries)) {
          console.error(`Error: key "${key}" not found in vault.`);
          process.exit(1);
        }

        delete vault.entries[key];
        vault.updatedAt = new Date().toISOString();

        await saveVault(vault, vaultPath);
        console.log(`✔ Key "${key}" removed from vault.`);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
