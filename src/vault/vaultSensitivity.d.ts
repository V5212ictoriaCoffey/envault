export type SensitivityLevel = 'public' | 'internal' | 'confidential' | 'secret';

export interface SensitivityStore {
  [key: string]: SensitivityLevel;
}

export declare function getSensitivityPath(vaultDir: string): string;
export declare function loadSensitivityStore(vaultDir: string): Promise<SensitivityStore>;
export declare function saveSensitivityStore(vaultDir: string, store: SensitivityStore): Promise<void>;
export declare function setSensitivity(vaultDir: string, key: string, level: SensitivityLevel): Promise<void>;
export declare function removeSensitivity(vaultDir: string, key: string): Promise<void>;
export declare function getSensitivity(vaultDir: string, key: string): Promise<SensitivityLevel | null>;
export declare function getKeysBySensitivity(vaultDir: string, level: SensitivityLevel): Promise<string[]>;
