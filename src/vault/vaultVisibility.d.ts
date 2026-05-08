export type VisibilityLevel = "public" | "private" | "secret";

export interface VisibilityStore {
  [key: string]: VisibilityLevel;
}

export declare function getVisibilityPath(vaultDir: string): string;
export declare function loadVisibilityStore(vaultDir: string): VisibilityStore;
export declare function saveVisibilityStore(vaultDir: string, store: VisibilityStore): void;
export declare function setVisibility(vaultDir: string, key: string, level: VisibilityLevel): VisibilityStore;
export declare function removeVisibility(vaultDir: string, key: string): VisibilityStore;
export declare function getVisibility(vaultDir: string, key: string): VisibilityLevel;
export declare function listByVisibility(vaultDir: string, level: VisibilityLevel): string[];
