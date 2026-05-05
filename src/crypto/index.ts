/**
 * envault crypto module
 *
 * Exports all cryptographic primitives used by envault for
 * key generation, storage, and loading.
 */

export { generateKeyPair, saveKeyPair, loadKey } from './keyPair';
export type { EnvaultKeyPair } from './keyPair';
