import { Command } from 'commander';
import * as readline from 'readline';
import * as path from 'path';
import { loadVault, saveVault } from '../../vault';
import { loadKey } from '../../crypto';
import { encryptEnvRecord } from '../../crypto/encrypt';

const DEFAULT_VAULT_PATH = '.envault';
const DEFAULT_PUBLIC_KEY_PATH = '.envault-public.pem';

function promptSecret(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerAddCommand(program: Command): void {
  program
    .command('add <key>')
    .description('Add or update an encrypted key-value pair in the vault')
    .option('-v, --vault <path>', 'Path to vault file', DEFAULT_VAULT_PATH)
    .option('-k, --public-key <path>', 'Path to public key', DEFAULT_PUBLIC_KEY_PATH)
    .option('--value <value>', 'Value to store (if not provided, will prompt)')
    .action(async (key: string, options) => {
      try {
        const vaultPath = path.resolve(options.vault);
        const publicKeyPath = path.resolve(options.publicKey);

        const value = options.value
          ? options.value
          : await promptSecret(`Enter value for ${key}: `);

        if (!value) {
          console.error('Error: value cannot be empty');
          process.exit(1);
        }

        const publicKey = await loadKey(publicKeyPath);
        const vault = await loadVault(vaultPath);
        const encrypted = encryptEnvRecord(key, value, publicKey);

        vault.entries[key] = encrypted;
        vault.updatedAt = new Date().toISOString();

        await saveVault(vault, vaultPath);
        console.log(`✔ Key "${key}" added/updated in vault.`);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
