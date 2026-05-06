import { Command } from 'commander';
import { loadVault } from '../../vault';
import { loadKey } from '../../crypto';
import { decryptWithPrivateKey } from '../../crypto/encrypt';
import * as path from 'path';
import * as fs from 'fs';

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('List all keys stored in the vault')
    .option('-v, --values', 'Reveal decrypted values (requires private key)')
    .option('--vault <path>', 'Path to vault file', '.envault')
    .option('--key <path>', 'Path to private key', '.envault.key')
    .action(async (options) => {
      const vaultPath = path.resolve(process.cwd(), options.vault);

      if (!fs.existsSync(vaultPath)) {
        console.error('No vault found. Run `envault init` first.');
        process.exit(1);
      }

      const vault = loadVault(vaultPath);
      const keys = Object.keys(vault.entries);

      if (keys.length === 0) {
        console.log('Vault is empty. Use `envault add` to add secrets.');
        return;
      }

      if (options.values) {
        const keyPath = path.resolve(process.cwd(), options.key);
        if (!fs.existsSync(keyPath)) {
          console.error('Private key not found. Cannot reveal values.');
          process.exit(1);
        }

        const privateKey = loadKey(keyPath);
        console.log(`\nVault entries (${keys.length}):\n`);
        let decryptionFailures = 0;
        for (const key of keys.sort()) {
          try {
            const value = decryptWithPrivateKey(vault.entries[key], privateKey);
            console.log(`  ${key}=${value}`);
          } catch {
            console.log(`  ${key}=<decryption failed>`);
            decryptionFailures++;
          }
        }
        if (decryptionFailures > 0) {
          console.warn(`\nWarning: ${decryptionFailures} entry/entries could not be decrypted. The key file may not match this vault.`);
        }
      } else {
        console.log(`\nVault entries (${keys.length}):\n`);
        for (const key of keys.sort()) {
          console.log(`  ${key}`);
        }
        console.log('\nUse --values flag to reveal decrypted values.');
      }
    });
}
