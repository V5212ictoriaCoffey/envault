import * as fs from 'fs';
import * as path from 'path';

export interface AccessEntry {
  alias: string;
  publicKeyPath: string;
  addedAt: string;
}

export interface AccessList {
  entries: AccessEntry[];
}

const ACCESS_FILE = '.envault-access.json';

export function loadAccessList(dir: string = process.cwd()): AccessList {
  const filePath = path.join(dir, ACCESS_FILE);
  if (!fs.existsSync(filePath)) {
    return { entries: [] };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as AccessList;
}

export function saveAccessList(list: AccessList, dir: string = process.cwd()): void {
  const filePath = path.join(dir, ACCESS_FILE);
  fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
}

export function addAccessEntry(
  list: AccessList,
  alias: string,
  publicKeyPath: string
): AccessList {
  const existing = list.entries.find((e) => e.alias === alias);
  if (existing) {
    throw new Error(`Access entry with alias "${alias}" already exists.`);
  }
  return {
    entries: [
      ...list.entries,
      { alias, publicKeyPath, addedAt: new Date().toISOString() },
    ],
  };
}

export function removeAccessEntry(list: AccessList, alias: string): AccessList {
  const exists = list.entries.some((e) => e.alias === alias);
  if (!exists) {
    throw new Error(`Access entry with alias "${alias}" not found.`);
  }
  return {
    entries: list.entries.filter((e) => e.alias !== alias),
  };
}

export function getAccessEntry(list: AccessList, alias: string): AccessEntry | undefined {
  return list.entries.find((e) => e.alias === alias);
}
