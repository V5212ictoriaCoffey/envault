import * as fs from 'fs';
import * as path from 'path';

export interface SecretMetadata {
  key: string;
  masked: boolean;
  redactInLogs: boolean;
  shareableWith: string[];
}

export interface SecretStore {
  [key: string]: SecretMetadata;
}

export function getSecretPath(vaultDir: string): string {
  return path.join(vaultDir, '.envault-secret.json');
}

export function loadSecretStore(vaultDir: string): SecretStore {
  const p = getSecretPath(vaultDir);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export function saveSecretStore(vaultDir: string, store: SecretStore): void {
  fs.writeFileSync(getSecretPath(vaultDir), JSON.stringify(store, null, 2));
}

export function markSecret(
  vaultDir: string,
  key: string,
  options: Partial<Omit<SecretMetadata, 'key'>> = {}
): SecretStore {
  const store = loadSecretStore(vaultDir);
  store[key] = {
    key,
    masked: options.masked ?? true,
    redactInLogs: options.redactInLogs ?? true,
    shareableWith: options.shareableWith ?? [],
  };
  saveSecretStore(vaultDir, store);
  return store;
}

export function unmarkSecret(vaultDir: string, key: string): SecretStore {
  const store = loadSecretStore(vaultDir);
  delete store[key];
  saveSecretStore(vaultDir, store);
  return store;
}

export function getSecretMetadata(vaultDir: string, key: string): SecretMetadata | undefined {
  return loadSecretStore(vaultDir)[key];
}

export function isSecret(vaultDir: string, key: string): boolean {
  return key in loadSecretStore(vaultDir);
}

export function listSecretKeys(vaultDir: string): string[] {
  return Object.keys(loadSecretStore(vaultDir));
}
