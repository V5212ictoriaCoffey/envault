import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { generateKeyPair, saveKeyPair, loadKey, EnvaultKeyPair } from './keyPair';

describe('generateKeyPair', () => {
  it('should generate a public and private key in PEM format', () => {
    const keyPair = generateKeyPair();

    expect(keyPair.publicKey).toContain('-----BEGIN PUBLIC KEY-----');
    expect(keyPair.privateKey).toContain('-----BEGIN PRIVATE KEY-----');
  });

  it('should generate unique key pairs on each call', () => {
    const keyPair1 = generateKeyPair();
    const keyPair2 = generateKeyPair();

    expect(keyPair1.publicKey).not.toEqual(keyPair2.publicKey);
    expect(keyPair1.privateKey).not.toEqual(keyPair2.privateKey);
  });
});

describe('saveKeyPair', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should write public and private key files to the output directory', () => {
    const keyPair = generateKeyPair();
    const { publicKeyPath, privateKeyPath } = saveKeyPair(keyPair, tmpDir);

    expect(fs.existsSync(publicKeyPath)).toBe(true);
    expect(fs.existsSync(privateKeyPath)).toBe(true);
  });

  it('should create the output directory if it does not exist', () => {
    const nestedDir = path.join(tmpDir, 'nested', '.envault');
    const keyPair = generateKeyPair();
    saveKeyPair(keyPair, nestedDir);

    expect(fs.existsSync(nestedDir)).toBe(true);
  });
});

describe('loadKey', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should load a key that was previously saved', () => {
    const keyPair = generateKeyPair();
    const { publicKeyPath } = saveKeyPair(keyPair, tmpDir);

    const loaded = loadKey(publicKeyPath);
    expect(loaded).toEqual(keyPair.publicKey);
  });

  it('should throw if the key file does not exist', () => {
    expect(() => loadKey('/nonexistent/path/key.pem')).toThrow('Key file not found');
  });
});
