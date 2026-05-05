import { generateKeyPairSync, KeyObject } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface EnvaultKeyPair {
  publicKey: string;
  privateKey: string;
}

/**
 * Generates a new RSA key pair for encrypting/decrypting .env files.
 */
export function generateKeyPair(): EnvaultKeyPair {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return { publicKey, privateKey };
}

/**
 * Saves a key pair to disk at the specified directory.
 */
export function saveKeyPair(
  keyPair: EnvaultKeyPair,
  outputDir: string = '.envault'
): { publicKeyPath: string; privateKeyPath: string } {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const publicKeyPath = path.join(outputDir, 'public.pem');
  const privateKeyPath = path.join(outputDir, 'private.pem');

  fs.writeFileSync(publicKeyPath, keyPair.publicKey, { encoding: 'utf8', mode: 0o644 });
  fs.writeFileSync(privateKeyPath, keyPair.privateKey, { encoding: 'utf8', mode: 0o600 });

  return { publicKeyPath, privateKeyPath };
}

/**
 * Loads a key from disk.
 */
export function loadKey(keyPath: string): string {
  if (!fs.existsSync(keyPath)) {
    throw new Error(`Key file not found: ${keyPath}`);
  }
  return fs.readFileSync(keyPath, { encoding: 'utf8' });
}
