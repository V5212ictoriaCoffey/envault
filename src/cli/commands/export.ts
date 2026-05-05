import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { loadVault, decryptVault, exportVaultToEnv } from '../../vault';
import { loadKey } from '../../crypto';

const DEFAULT_VAULT_PATH = '.envault';
const DEFAULT_PRIVATE_KEY_PATH = '.envault-private.pem';
const DEFAULT_OUTPUT_PATH = '.env';

export function registerExportCommand(program: Command): void {
  program
    .command('export')
    .description('Decrypt the vault and export secrets to a .env file')
    .option('-v, --vault <path>', 'Path to the vault file', DEFAULT_VAULT_PATH)
    .option('-k, --key <path>', 'Path to the private key file', DEFAULT_PRIVATE_KEY_PATH)
    .option('-o, --output <path>', 'Output .env file path', DEFAULT_OUTPUT_PATH)
    .option('--overwrite', 'Overwrite existing .env file without prompting', false)
    .action(async (options) => {
      const vaultPath = path.resolve(options.vault);
      const keyPath = path.resolve(options.key);
      const outputPath = path.resolve(options.output);

      if (!fs.existsSync(vaultPath)) {
        console.error(`Error: Vault file not found at ${vaultPath}`);
        process.exit(1);
      }

      if (!fs.existsSync(keyPath)) {
        console.error(`Error: Private key file not found at ${keyPath}`);
        process.exit(1);
      }

      if (fs.existsSync(outputPath) && !options.overwrite) {
        console.error(
          `Error: Output file already exists at ${outputPath}. Use --overwrite to replace it.`
        );
        process.exit(1);
      }

      try {
        const privateKey = loadKey(keyPath);
        const vault = loadVault(vaultPath);
        const decrypted = decryptVault(vault, privateKey);
        const envContent = exportVaultToEnv(decrypted);

        fs.writeFileSync(outputPath, envContent, 'utf-8');
        console.log(`✔ Exported ${Object.keys(decrypted).length} secret(s) to ${outputPath}`);
      } catch (err: any) {
        console.error(`Error: Failed to export vault — ${err.message}`);
        process.exit(1);
      }
    });
}
