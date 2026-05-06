import fs from "fs";
import path from "path";

export interface AliasStore {
  aliases: Record<string, string>;
}

export function getAliasPath(vaultDir: string): string {
  return path.join(vaultDir, ".vault-aliases.json");
}

export function loadAliasStore(vaultDir: string): AliasStore {
  const aliasPath = getAliasPath(vaultDir);
  if (!fs.existsSync(aliasPath)) {
    return { aliases: {} };
  }
  const raw = fs.readFileSync(aliasPath, "utf-8");
  return JSON.parse(raw) as AliasStore;
}

export function saveAliasStore(vaultDir: string, store: AliasStore): void {
  const aliasPath = getAliasPath(vaultDir);
  fs.writeFileSync(aliasPath, JSON.stringify(store, null, 2), "utf-8");
}

export function addAlias(
  vaultDir: string,
  alias: string,
  key: string
): AliasStore {
  const store = loadAliasStore(vaultDir);
  store.aliases[alias] = key;
  saveAliasStore(vaultDir, store);
  return store;
}

export function removeAlias(vaultDir: string, alias: string): AliasStore {
  const store = loadAliasStore(vaultDir);
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
