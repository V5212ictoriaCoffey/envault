export interface DependencyStore {
  [key: string]: string[];
}

export declare function getDependencyPath(vaultDir: string): string;

export declare function loadDependencyStore(vaultDir: string): DependencyStore;

export declare function saveDependencyStore(
  vaultDir: string,
  store: DependencyStore
): void;

export declare function addDependency(
  vaultDir: string,
  key: string,
  dependsOn: string
): void;

export declare function removeDependency(
  vaultDir: string,
  key: string,
  dependsOn: string
): void;

export declare function getDependencies(
  vaultDir: string,
  key: string
): string[];

export declare function getDependents(
  vaultDir: string,
  key: string
): string[];

export declare function clearDependencies(
  vaultDir: string,
  key: string
): void;
