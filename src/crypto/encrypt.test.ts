import { describe, it, expect, beforeAll } from 'vitest';
import { generateKeyPair } from './keyPair';
import {
  encryptWithPublicKey,
  decryptWithPrivateKey,
  encryptEnvRecord,
  decryptEnvRecord,
} from './encrypt';

describe('encrypt / decrypt', () => {
  let publicKey: string;
  let privateKey: string;

  beforeAll(async () => {
    const pair = await generateKeyPair();
    publicKey = pair.publicKey;
    privateKey = pair.privateKey;
  });

  it('encrypts a string and produces a non-empty base64 string', () => {
    const ciphertext = encryptWithPublicKey(publicKey, 'hello world');
    expect(typeof ciphertext).toBe('string');
    expect(ciphertext.length).toBeGreaterThan(0);
    expect(Buffer.from(ciphertext, 'base64').toString('base64')).toBe(ciphertext);
  });

  it('decrypts an encrypted string back to the original plaintext', () => {
    const original = 'super-secret-value';
    const ciphertext = encryptWithPublicKey(publicKey, original);
    const decrypted = decryptWithPrivateKey(privateKey, ciphertext);
    expect(decrypted).toBe(original);
  });

  it('produces different ciphertexts for the same plaintext (OAEP randomness)', () => {
    const plaintext = 'same-value';
    const ct1 = encryptWithPublicKey(publicKey, plaintext);
    const ct2 = encryptWithPublicKey(publicKey, plaintext);
    expect(ct1).not.toBe(ct2);
  });

  it('throws when decrypting with the wrong private key', async () => {
    const { privateKey: wrongPrivateKey } = await generateKeyPair();
    const ciphertext = encryptWithPublicKey(publicKey, 'data');
    expect(() => decryptWithPrivateKey(wrongPrivateKey, ciphertext)).toThrow();
  });

  it('throws when decrypting malformed/corrupted ciphertext', () => {
    const corruptedCiphertext = Buffer.from('not-valid-ciphertext').toString('base64');
    expect(() => decryptWithPrivateKey(privateKey, corruptedCiphertext)).toThrow();
  });

  it('encrypts all values in an env record', () => {
    const env = { DB_URL: 'postgres://localhost/db', API_KEY: 'abc123' };
    const encrypted = encryptEnvRecord(publicKey, env);
    expect(Object.keys(encrypted)).toEqual(Object.keys(env));
    expect(encrypted.DB_URL).not.toBe(env.DB_URL);
    expect(encrypted.API_KEY).not.toBe(env.API_KEY);
  });

  it('round-trips an entire env record', () => {
    const env = { DB_URL: 'postgres://localhost/db', API_KEY: 'abc123', PORT: '3000' };
    const encrypted = encryptEnvRecord(publicKey, env);
    const decrypted = decryptEnvRecord(privateKey, encrypted);
    expect(decrypted).toEqual(env);
  });

  it('handles empty string values', () => {
    const env = { EMPTY: '' };
    const encrypted = encryptEnvRecord(publicKey, env);
    const decrypted = decryptEnvRecord(privateKey, encrypted);
    expect(decrypted.EMPTY).toBe('');
  });
});
