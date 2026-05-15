import * as fs from "fs";
import * as path from "path";

export type EncodingType = "base64" | "hex" | "utf8" | "url";

export interface EncodingStore {
  [key: string]: EncodingType;
}

export function getEncodingPath(vaultDir: string): string {
  return path.join(vaultDir, ".encoding.json");
}

export function loadEncodingStore(vaultDir: string): EncodingStore {
  const filePath = getEncodingPath(vaultDir);
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

export function saveEncodingStore(vaultDir: string, store: EncodingStore): void {
  const filePath = getEncodingPath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf8");
}

export function setEncoding(vaultDir: string, key: string, encoding: EncodingType): void {
  const store = loadEncodingStore(vaultDir);
  store[key] = encoding;
  saveEncodingStore(vaultDir, store);
}

export function removeEncoding(vaultDir: string, key: string): void {
  const store = loadEncodingStore(vaultDir);
  delete store[key];
  saveEncodingStore(vaultDir, store);
}

export function getEncoding(vaultDir: string, key: string): EncodingType | undefined {
  const store = loadEncodingStore(vaultDir);
  return store[key];
}

export function listEncodings(vaultDir: string): EncodingStore {
  return loadEncodingStore(vaultDir);
}

export function encodeValue(value: string, encoding: EncodingType): string {
  switch (encoding) {
    case "base64":
      return Buffer.from(value, "utf8").toString("base64");
    case "hex":
      return Buffer.from(value, "utf8").toString("hex");
    case "url":
      return encodeURIComponent(value);
    case "utf8":
    default:
      return value;
  }
}

export function decodeValue(value: string, encoding: EncodingType): string {
  switch (encoding) {
    case "base64":
      return Buffer.from(value, "base64").toString("utf8");
    case "hex":
      return Buffer.from(value, "hex").toString("utf8");
    case "url":
      return decodeURIComponent(value);
    case "utf8":
    default:
      return value;
  }
}
