import fs from "fs";
import path from "path";

export interface AliasStore {
  aliases: Record<string, string>; // alias -> canonical key
}

export function getAliasPath(vaultDir: string): string {
  return path.join(vaultDir, ".envault-aliases.json");
}

export function loadAliasStore(vaultDir: string): AliasStore {
  const filePath = getAliasPath(vaultDir);
  if (!fs.existsSync(filePath)) {
    return { aliases: {} };
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as AliasStore;
}

export function saveAliasStore(vaultDir: string, store: AliasStore): void {
  const filePath = getAliasPath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function addAlias(
  vaultDir: string,
  alias: string,
  canonicalKey: string
): AliasStore {
  if (!/^[A-Z0-9_]+$/i.test(alias)) {
    throw new Error(`Invalid alias "${alias}": must be alphanumeric/underscore.`);
  }
  const store = loadAliasStore(vaultDir);
  if (store.aliases[alias] && store.aliases[alias] !== canonicalKey) {
    throw new Error(
      `Alias "${alias}" already points to "${store.aliases[alias]}".`
    );
  }
  store.aliases[alias] = canonicalKey;
  saveAliasStore(vaultDir, store);
  return store;
}

export function removeAlias(vaultDir: string, alias: string): AliasStore {
  const store = loadAliasStore(vaultDir);
  if (!store.aliases[alias]) {
    throw new Error(`Alias "${alias}" not found.`);
  }
  delete store.aliases[alias];
  saveAliasStore(vaultDir, store);
  return store;
}

export function resolveAlias(
  vaultDir: string,
  aliasOrKey: string
): string {
  const store = loadAliasStore(vaultDir);
  return store.aliases[aliasOrKey] ?? aliasOrKey;
}

export function listAliases(
  vaultDir: string
): Array<{ alias: string; key: string }> {
  const store = loadAliasStore(vaultDir);
  return Object.entries(store.aliases).map(([alias, key]) => ({ alias, key }));
}
