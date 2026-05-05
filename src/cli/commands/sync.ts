import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { loadVault, saveVault } from '../../vault';
import { loadKey } from '../../crypto';
import { mergeVaults, diffVaultKeys } from '../../vault/vaultMerge';
import { Vault } from '../../vault/vault';

export function registerSyncCommand(program: Command): void {
  program
    .command('sync <vaultFile>')
    .description('Sync a remote or shared vault file into the local vault')
    .option('-k, --key <keyFile>', 'Path to private key for decryption', '.envault/private.key')
    .option('-v, --vault <localVault>', 'Path to local vault file', '.envault/vault.json')
    .option('--dry-run', 'Preview changes without applying them', false)
    .action(async (vaultFile: string, options: { key: string; vault: string; dryRun: boolean }) => {
      try {
        if (!fs.existsSync(vaultFile)) {
          console.error(`Remote vault file not found: ${vaultFile}`);
          process.exit(1);
        }

        const remoteVault: Vault = loadVault(vaultFile);

        if (!fs.existsSync(options.vault)) {
          console.error(`Local vault not found at ${options.vault}. Run 'envault init' first.`);
          process.exit(1);
        }

        const localVault: Vault = loadVault(options.vault);
        const diff = diffVaultKeys(localVault, remoteVault);

        if (diff.added.length === 0 && diff.removed.length === 0 && diff.updated.length === 0) {
          console.log('Vaults are already in sync. No changes needed.');
          return;
        }

        console.log('Sync diff:');
        if (diff.added.length > 0) console.log(`  + Added:   ${diff.added.join(', ')}`);
        if (diff.updated.length > 0) console.log(`  ~ Updated: ${diff.updated.join(', ')}`);
        if (diff.removed.length > 0) console.log(`  - Removed: ${diff.removed.join(', ')}`);

        if (options.dryRun) {
          console.log('\nDry run: no changes applied.');
          return;
        }

        const privateKey = loadKey(options.key);
        const mergedVault = mergeVaults(localVault, remoteVault, privateKey);

        saveVault(mergedVault, options.vault);
        console.log(`\nVault synced successfully → ${options.vault}`);
      } catch (err: any) {
        console.error('Sync failed:', err.message);
        process.exit(1);
      }
    });
}
