export interface LinkedKeyEntry {
  sourceKey: string;
  targetKey: string;
  description?: string;
  createdAt: string;
}

export interface LinkedKeyStore {
  links: LinkedKeyEntry[];
}

export declare function getLinkedPath(vaultDir: string): string;
export declare function loadLinkedStore(vaultDir: string): LinkedKeyStore;
export declare function saveLinkedStore(vaultDir: string, store: LinkedKeyStore): void;
export declare function linkKeys(
  vaultDir: string,
  sourceKey: string,
  targetKey: string,
  description?: string
): void;
export declare function unlinkKeys(
  vaultDir: string,
  sourceKey: string,
  targetKey: string
): void;
export declare function getLinksForKey(vaultDir: string, key: string): LinkedKeyEntry[];
export declare function getAllLinks(vaultDir: string): LinkedKeyEntry[];
