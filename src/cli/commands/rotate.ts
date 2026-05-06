import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { generateKeyPair, saveKeyPair, loadKey } from '../../crypto/keyPair';
import { loadVault, saveVault, decryptVault, createVault } from '../../vault/vault';
import { encryptEnvRecord } from '../../crypto/encrypt';

const VAULT_FILE = '.envault';
const DEFAULT_KEY_DIR = '.envault-keys';

export function registerRotateCommand(program: Command): void {
  program
    .command('rotate')
    .description('Rotate encryption keys and re-encrypt the vault with new keys')
    .option('-k, --key-dir <dir>', 'Directory to store new keys', DEFAULT_KEY_DIR)
    .option('--old-private-key <file>', 'Path to the old private key (for decryption)')
    .action(async (options) => {
      try {
        const vaultPath = path.resolve(process.cwd(), VAULT_FILE);

        if (!fs.existsSync(vaultPath)) {
          console.error('No vault found. Run `envault init` first.');
          process.exit(1);
        }

        const keyDir = path.resolve(process.cwd(), options.keyDir);
        const oldPrivateKeyPath = options.oldPrivateKey
          ? path.resolve(options.oldPrivateKey)
          : path.join(keyDir, 'private.pem');

        if (!fs.existsSync(oldPrivateKeyPath)) {
          console.error(`Old private key not found at: ${oldPrivateKeyPath}`);
          process.exit(1);
        }

        console.log('Loading existing vault...');
        const vault = loadVault(vaultPath);

        console.log('Decrypting vault with old private key...');
        const oldPrivateKey = loadKey(oldPrivateKeyPath);
        const decrypted = decryptVault(vault, oldPrivateKey);

        console.log('Generating new key pair...');
        const { publicKey, privateKey } = generateKeyPair();

        const backupDir = path.join(keyDir, `backup-${Date.now()}`);
        fs.mkdirSync(backupDir, { recursive: true });
        const oldPublicKeyPath = path.join(keyDir, 'public.pem');
        if (fs.existsSync(oldPublicKeyPath)) {
          fs.copyFileSync(oldPublicKeyPath, path.join(backupDir, 'public.pem'));
        }
        fs.copyFileSync(oldPrivateKeyPath, path.join(backupDir, 'private.pem'));
        console.log(`Old keys backed up to: ${backupDir}`);

        saveKeyPair(publicKey, privateKey, keyDir);
        console.log('New keys saved.');

        console.log('Re-encrypting vault with new public key...');
        const newVault = createVault();
        for (const [key, value] of Object.entries(decrypted)) {
          newVault.records[key] = encryptEnvRecord(key, value, publicKey);
        }
        newVault.createdAt = vault.createdAt;
        newVault.updatedAt = new Date().toISOString();

        saveVault(newVault, vaultPath);
        console.log(`Key rotation complete. ${Object.keys(decrypted).length} record(s) re-encrypted.`);
      } catch (err: any) {
        console.error('Rotation failed:', err.message);
        process.exit(1);
      }
    });
}
