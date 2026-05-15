import * as fs from "fs";
import * as path from "path";

export type FormatType = "json" | "dotenv" | "yaml" | "csv";

export interface FormatStore {
  [key: string]: FormatType;
}

export function getFormatPath(vaultDir: string): string {
  return path.join(vaultDir, ".vault-format.json");
}

export function loadFormatStore(vaultDir: string): FormatStore {
  const p = getFormatPath(vaultDir);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

export function saveFormatStore(vaultDir: string, store: FormatStore): void {
  fs.writeFileSync(getFormatPath(vaultDir), JSON.stringify(store, null, 2));
}

export function setFormat(vaultDir: string, key: string, format: FormatType): FormatStore {
  const store = loadFormatStore(vaultDir);
  store[key] = format;
  saveFormatStore(vaultDir, store);
  return store;
}

export function removeFormat(vaultDir: string, key: string): FormatStore {
  const store = loadFormatStore(vaultDir);
  delete store[key];
  saveFormatStore(vaultDir, store);
  return store;
}

export function getFormat(vaultDir: string, key: string): FormatType | undefined {
  return loadFormatStore(vaultDir)[key];
}

export function listFormats(vaultDir: string): { key: string; format: FormatType }[] {
  const store = loadFormatStore(vaultDir);
  return Object.entries(store).map(([key, format]) => ({ key, format }));
}

export const VALID_FORMATS: FormatType[] = ["json", "dotenv", "yaml", "csv"];

export function isValidFormat(value: string): value is FormatType {
  return VALID_FORMATS.includes(value as FormatType);
}
