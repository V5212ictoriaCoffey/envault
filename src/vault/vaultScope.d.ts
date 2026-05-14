export type ScopeLevel = "local" | "shared" | "global";

export interface ScopeStore {
  [key: string]: ScopeLevel;
}

export declare function getScopePath(vaultDir: string): string;
export declare function loadScopeStore(vaultDir: string): ScopeStore;
export declare function saveScopeStore(vaultDir: string, store: ScopeStore): void;
export declare function setScope(vaultDir: string, key: string, level: ScopeLevel): ScopeStore;
export declare function removeScope(vaultDir: string, key: string): ScopeStore;
export declare function getScope(vaultDir: string, key: string): ScopeLevel | undefined;
export declare function getKeysByScope(vaultDir: string, level: ScopeLevel): string[];
export declare function formatScopeList(store: ScopeStore): string;
