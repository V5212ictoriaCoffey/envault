import { Command } from "commander";
import * as path from "path";
import {
  pinKey,
  unpinKey,
  getPinnedKeys,
  loadPinStore,
  formatPinList,
  isPinned,
} from "../../vault/vaultPin";

const DEFAULT_VAULT_DIR = path.resolve(".");

export function registerPinCommand(program: Command): void {
  const pin = program
    .command("pin")
    .description("Pin or unpin vault keys for quick reference");

  pin
    .command("add <key> [alias]")
    .description("Pin a vault key with an optional alias label")
    .option("--vault-dir <dir>", "Path to vault directory", DEFAULT_VAULT_DIR)
    .action((key: string, alias: string | undefined, opts: { vaultDir: string }) => {
      const label = alias ?? key;
      if (isPinned(opts.vaultDir, key)) {
        console.log(`Key "${key}" is already pinned. Updating alias to "${label}".`);
      }
      pinKey(opts.vaultDir, key, label);
      console.log(`Pinned "${key}" with alias "${label}".`);
    });

  pin
    .command("remove <key>")
    .description("Unpin a vault key")
    .option("--vault-dir <dir>", "Path to vault directory", DEFAULT_VAULT_DIR)
    .action((key: string, opts: { vaultDir: string }) => {
      if (!isPinned(opts.vaultDir, key)) {
        console.error(`Key "${key}" is not pinned.`);
        process.exit(1);
      }
      unpinKey(opts.vaultDir, key);
      console.log(`Unpinned "${key}".`);
    });

  pin
    .command("list")
    .description("List all pinned keys")
    .option("--vault-dir <dir>", "Path to vault directory", DEFAULT_VAULT_DIR)
    .action((opts: { vaultDir: string }) => {
      const store = loadPinStore(opts.vaultDir);
      console.log(formatPinList(store));
    });

  pin
    .command("check <key>")
    .description("Check if a key is pinned")
    .option("--vault-dir <dir>", "Path to vault directory", DEFAULT_VAULT_DIR)
    .action((key: string, opts: { vaultDir: string }) => {
      const pinned = isPinned(opts.vaultDir, key);
      console.log(pinned ? `"${key}" is pinned.` : `"${key}" is not pinned.`);
    });
}
