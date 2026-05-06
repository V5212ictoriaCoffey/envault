import { Command } from 'commander';
import { loadVault } from '../../vault';
import { loadKey } from '../../crypto';
import * as path from 'path';
import * as fs from 'fs';

export function registerInfoCommand(program: Command): void {
  program
    .command('info')
    .description('Display metadata about the current vault')
    .option('-v, --vault <path>', 'Path to vault file', '.envault')
    .option('-k, --key <path>', 'Path to public key', '.envault.pub')
    .action(async (options) => {
      try {
        const vaultPath = path.resolve(options.vault);
        const keyPath = path.resolve(options.key);

        if (!fs.existsSync(vaultPath)) {
          console.error('No vault found. Run `envault init` to create one.');
          process.exit(1);
        }

        const vault = await loadVault(vaultPath);
        const keyExists = fs.existsSync(keyPath);

        const keyCount = Object.keys(vault.data).length;
        const createdAt = vault.createdAt
          ? new Date(vault.createdAt).toLocaleString()
          : 'unknown';
        const updatedAt = vault.updatedAt
          ? new Date(vault.updatedAt).toLocaleString()
          : 'unknown';

        console.log('\n=== Envault Info ===');
        console.log(`Vault path:    ${vaultPath}`);
        console.log(`Public key:    ${keyExists ? keyPath : 'not found'}`);
        console.log(`Keys stored:   ${keyCount}`);
        console.log(`Created at:    ${createdAt}`);
        console.log(`Last updated:  ${updatedAt}`);
        console.log(`Version:       ${vault.version ?? '1'}`);
        console.log('');
      } catch (err: any) {
        console.error('Failed to read vault info:', err.message);
        process.exit(1);
      }
    });
}
