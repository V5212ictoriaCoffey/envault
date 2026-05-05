import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  createVault,
  saveVault,
  loadVault,
  decryptVault,
  exportVaultToEnv,
} from './vault';
import { generateKeyPair, saveKeyPair } from '../crypto/keyPair';

let tmpDir: string;
let publicKeyPath: string;
let privateKeyPath: string;
let envPath: string;
let vaultPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-test-'));
  const { publicKey, privateKey } = generateKeyPair();
  publicKeyPath = path.join(tmpDir, 'public.pem');
  privateKeyPath = path.join(tmpDir, 'private.pem');
  saveKeyPair(publicKey, privateKey, tmpDir);

  envPath = path.join(tmpDir, '.env');
  vaultPath = path.join(tmpDir, 'vault.json');
  fs.writeFileSync(envPath, 'API_KEY=secret123\nDB_URL=postgres://localhost/db\n', 'utf-8');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('createVault encrypts env entries', () => {
  const vault = createVault(envPath, publicKeyPath);
  expect(vault.version).toBe(1);
  expect(Object.keys(vault.entries)).toContain('API_KEY');
  expect(Object.keys(vault.entries)).toContain('DB_URL');
  expect(vault.entries['API_KEY']).not.toBe('secret123');
});

test('saveVault and loadVault round-trip', () => {
  const vault = createVault(envPath, publicKeyPath);
  saveVault(vault, vaultPath);
  const loaded = loadVault(vaultPath);
  expect(loaded.version).toBe(vault.version);
  expect(loaded.entries).toEqual(vault.entries);
});

test('decryptVault restores original values', () => {
  const vault = createVault(envPath, publicKeyPath);
  const decrypted = decryptVault(vault, privateKeyPath);
  expect(decrypted['API_KEY']).toBe('secret123');
  expect(decrypted['DB_URL']).toBe('postgres://localhost/db');
});

test('exportVaultToEnv writes decrypted .env file', () => {
  const vault = createVault(envPath, publicKeyPath);
  saveVault(vault, vaultPath);
  const loaded = loadVault(vaultPath);
  const outputPath = path.join(tmpDir, '.env.decrypted');
  exportVaultToEnv(loaded, privateKeyPath, outputPath);
  const content = fs.readFileSync(outputPath, 'utf-8');
  expect(content).toContain('API_KEY=secret123');
  expect(content).toContain('DB_URL=postgres://localhost/db');
});

test('loadVault throws on unsupported version', () => {
  const badVault = { version: 99, createdAt: '', updatedAt: '', entries: {} };
  const badPath = path.join(tmpDir, 'bad.json');
  fs.writeFileSync(badPath, JSON.stringify(badVault));
  expect(() => loadVault(badPath)).toThrow('Unsupported vault version: 99');
});
