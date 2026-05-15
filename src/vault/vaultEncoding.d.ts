export type EncodingType = 'utf8' | 'base64' | 'hex' | 'latin1';

export interface EncodingStore {
  [key: string]: EncodingType;
}

export declare function getEncodingPath(vaultDir: string): string;
export declare function loadEncodingStore(vaultDir: string): Promise<EncodingStore>;
export declare function saveEncodingStore(vaultDir: string, store: EncodingStore): Promise<void>;
export declare function setEncoding(vaultDir: string, key: string, encoding: EncodingType): Promise<void>;
export declare function removeEncoding(vaultDir: string, key: string): Promise<void>;
export declare function getEncoding(vaultDir: string, key: string): Promise<EncodingType | undefined>;
export declare function listEncodings(vaultDir: string): Promise<EncodingStore>;
