export interface RequireStore {
  required: string[];
}

export declare function getRequirePath(vaultDir: string): string;

export declare function loadRequireStore(vaultDir: string): RequireStore;

export declare function saveRequireStore(
  vaultDir: string,
  store: RequireStore
): void;

export declare function requireKey(vaultDir: string, key: string): void;

export declare function unrequireKey(vaultDir: string, key: string): void;

export declare function isKeyRequired(vaultDir: string, key: string): boolean;

export declare function listRequiredKeys(vaultDir: string): string[];

export declare function validateRequiredKeys(
  vaultDir: string,
  presentKeys: string[]
): string[];
