export type FormatType = 'string' | 'number' | 'boolean' | 'json' | 'url' | 'email';

export interface FormatStore {
  [key: string]: FormatType;
}

export declare function getFormatPath(vaultDir: string): string;
export declare function loadFormatStore(vaultDir: string): Promise<FormatStore>;
export declare function saveFormatStore(vaultDir: string, store: FormatStore): Promise<void>;
export declare function setFormat(vaultDir: string, key: string, format: FormatType): Promise<void>;
export declare function removeFormat(vaultDir: string, key: string): Promise<void>;
export declare function getFormat(vaultDir: string, key: string): Promise<FormatType | undefined>;
export declare function validateValueFormat(value: string, format: FormatType): boolean;
export declare function formatSummary(store: FormatStore): string;
