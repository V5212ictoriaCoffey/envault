import * as crypto from 'crypto';

/**
 * Encrypts a plaintext string using an RSA public key.
 * Uses RSA-OAEP with SHA-256 for secure asymmetric encryption.
 */
export function encryptWithPublicKey(publicKeyPem: string, plaintext: string): string {
  const buffer = Buffer.from(plaintext, 'utf8');
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    buffer
  );
  return encrypted.toString('base64');
}

/**
 * Decrypts a base64-encoded ciphertext using an RSA private key.
 * Uses RSA-OAEP with SHA-256 for secure asymmetric decryption.
 */
export function decryptWithPrivateKey(privateKeyPem: string, ciphertext: string): string {
  const buffer = Buffer.from(ciphertext, 'base64');
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    buffer
  );
  return decrypted.toString('utf8');
}

/**
 * Encrypts each value in an env record, returning a new record
 * with all values replaced by their base64-encoded ciphertexts.
 */
export function encryptEnvRecord(
  publicKeyPem: string,
  envRecord: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(envRecord)) {
    result[key] = encryptWithPublicKey(publicKeyPem, value);
  }
  return result;
}

/**
 * Decrypts each value in an encrypted env record, returning a new record
 * with all values replaced by their plaintext originals.
 */
export function decryptEnvRecord(
  privateKeyPem: string,
  encryptedRecord: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(encryptedRecord)) {
    result[key] = decryptWithPrivateKey(privateKeyPem, value);
  }
  return result;
}
