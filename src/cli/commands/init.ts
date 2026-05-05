import * as path from "path";
import * as fs from "fs";
import { generateKeyPair, saveKeyPair } from "../../crypto/keyPair";
import { createVault, saveVault } from "../../vault/vault";

const DEFAULT_VAULT_FILE = ".envault";
const DEFAULT_KEY_DIR = ".envault-keys";

export interface InitOptions {
  keyDir?: string;
  vaultFile?: string;
  force?: boolean;
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  const keyDir = path.resolve(options.keyDir ?? DEFAULT_KEY_DIR);
  const vaultFile = path.resolve(options.vaultFile ?? DEFAULT_VAULT_FILE);

  if (!options.force) {
    if (fs.existsSync(vaultFile)) {
      throw new Error(
        `Vault file already exists at ${vaultFile}. Use --force to overwrite.`
      );
    }
    if (fs.existsSync(keyDir)) {
      throw new Error(
        `Key directory already exists at ${keyDir}. Use --force to overwrite.`
      );
    }
  }

  console.log("Generating key pair...");
  const { publicKey, privateKey } = generateKeyPair();

  fs.mkdirSync(keyDir, { recursive: true });
  await saveKeyPair(publicKey, privateKey, keyDir);
  console.log(`Keys saved to ${keyDir}/`);

  const vault = createVault(publicKey);
  await saveVault(vault, vaultFile);
  console.log(`Vault initialized at ${vaultFile}`);

  console.log(
    "\n⚠️  Add the following to your .gitignore:",
    `\n  ${path.basename(keyDir)}/private.pem`
  );
}
