import { Command } from "commander";
import path from "path";
import {
  setExpiry,
  removeExpiry,
  listExpiryEntries,
  listExpiredKeys,
} from "../../vault/vaultExpiry";

const DEFAULT_VAULT_DIR = path.resolve(".");

export function registerExpiryCommand(program: Command): void {
  const expiry = program
    .command("expiry")
    .description("Manage expiry dates for vault keys");

  expiry
    .command("set <key> <date>")
    .description("Set an expiry date for a key (ISO 8601 or YYYY-MM-DD)")
    .option("--vault-dir <dir>", "Vault directory", DEFAULT_VAULT_DIR)
    .action((key: string, date: string, opts: { vaultDir: string }) => {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        console.error(`Invalid date: ${date}`);
        process.exit(1);
      }
      setExpiry(opts.vaultDir, key, parsed);
      console.log(`Expiry set for "${key}": ${parsed.toISOString()}`);
    });

  expiry
    .command("remove <key>")
    .description("Remove the expiry date for a key")
    .option("--vault-dir <dir>", "Vault directory", DEFAULT_VAULT_DIR)
    .action((key: string, opts: { vaultDir: string }) => {
      removeExpiry(opts.vaultDir, key);
      console.log(`Expiry removed for "${key}"`);
    });

  expiry
    .command("list")
    .description("List all keys with expiry dates")
    .option("--vault-dir <dir>", "Vault directory", DEFAULT_VAULT_DIR)
    .option("--expired-only", "Show only expired keys", false)
    .action((opts: { vaultDir: string; expiredOnly: boolean }) => {
      const entries = listExpiryEntries(opts.vaultDir);
      if (entries.length === 0) {
        console.log("No expiry entries found.");
        return;
      }
      const filtered = opts.expiredOnly ? entries.filter((e) => e.expired) : entries;
      if (filtered.length === 0) {
        console.log("No expired keys found.");
        return;
      }
      filtered.forEach(({ key, expiresAt, expired }) => {
        const status = expired ? "[EXPIRED]" : "[active] ";
        console.log(`${status} ${key.padEnd(30)} ${expiresAt.toISOString()}`);
      });
    });

  expiry
    .command("check")
    .description("Print all expired keys and exit with code 1 if any exist")
    .option("--vault-dir <dir>", "Vault directory", DEFAULT_VAULT_DIR)
    .action((opts: { vaultDir: string }) => {
      const expired = listExpiredKeys(opts.vaultDir);
      if (expired.length === 0) {
        console.log("All keys are within their expiry dates.");
        return;
      }
      console.warn(`${expired.length} expired key(s):`);
      expired.forEach((k) => console.warn(`  - ${k}`));
      process.exit(1);
    });
}
