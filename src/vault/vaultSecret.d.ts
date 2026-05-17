export interface SecretMetadata {
  key: string;
  masked: boolean;
  redactInLogs: boolean;
  shareableWith: string[];
}

export interface SecretStore {
  [key: string]: SecretMetadata;
}

export declare function getSecretPath(vaultDir: string): string;
export declare function loadSecretStore(vaultDir: string): SecretStore;
export declare function saveSecretStore(vaultDir: string, store: SecretStore): void;
export declare function markSecret(
  vaultDir: string,
  key: string,
  options?: Partial<Omit<SecretMetadata, 'key'>>
): SecretStore;
export declare function unmarkSecret(vaultDir: string, key: string): SecretStore;
export declare function getSecretMetadata(vaultDir: string, key: string): SecretMetadata | undefined;
export declare function isSecret(vaultDir: string, key: string): boolean;
export declare function listSecretKeys(vaultDir: string): string[];
