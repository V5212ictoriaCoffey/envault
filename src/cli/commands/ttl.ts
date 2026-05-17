import { Command } from "commander";
import * as path from "path";
import {
  setTTL,
  removeTTL,
  getTTL,
  listExpiredKeys,
  isExpired,
  loadTTLStore,
} from "../../vault/vaultTTL";

export function registerTTLCommand(program: Command): void {
  const ttl = program
    .command("ttl")
    .description("Manage time-to-live (TTL) for vault keys");

  ttl
    .command("set <key> <seconds>")
    .description("Set a TTL (in seconds) for a vault key")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action((key: string, seconds: string, opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      const ttlSeconds = parseInt(seconds, 10);
      if (isNaN(ttlSeconds) || ttlSeconds <= 0) {
        console.error("TTL must be a positive integer (seconds).");
        process.exit(1);
      }
      const entry = setTTL(vaultDir, key, ttlSeconds);
      console.log(`TTL set for "${key}": ${entry.ttlSeconds}s (expires ${new Date(new Date(entry.createdAt).getTime() + ttlSeconds * 1000).toISOString()})`);
    });

  ttl
    .command("get <key>")
    .description("Get the TTL entry for a vault key")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action((key: string, opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      const entry = getTTL(vaultDir, key);
      if (!entry) {
        console.log(`No TTL set for "${key}".`);
        return;
      }
      const expired = isExpired(entry);
      const expiresAt = new Date(new Date(entry.createdAt).getTime() + entry.ttlSeconds * 1000);
      console.log(`Key: ${entry.key}`);
      console.log(`TTL: ${entry.ttlSeconds}s`);
      console.log(`Created: ${entry.createdAt}`);
      console.log(`Expires: ${expiresAt.toISOString()}`);
      console.log(`Status: ${expired ? "EXPIRED" : "active"}`);
    });

  ttl
    .command("remove <key>")
    .description("Remove the TTL for a vault key")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action((key: string, opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      const removed = removeTTL(vaultDir, key);
      if (removed) {
        console.log(`TTL removed for "${key}".`);
      } else {
        console.log(`No TTL found for "${key}".`);
      }
    });

  ttl
    .command("list")
    .description("List all keys with TTL and their expiry status")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .option("--expired", "Show only expired keys")
    .action((opts: { dir: string; expired?: boolean }) => {
      const vaultDir = path.resolve(opts.dir);
      if (opts.expired) {
        const keys = listExpiredKeys(vaultDir);
        if (keys.length === 0) {
          console.log("No expired keys found.");
        } else {
          console.log("Expired keys:");
          keys.forEach((k) => console.log(`  - ${k}`));
        }
        return;
      }
      const store = loadTTLStore(vaultDir);
      const entries = Object.values(store);
      if (entries.length === 0) {
        console.log("No TTL entries found.");
        return;
      }
      entries.forEach((entry) => {
        const expired = isExpired(entry);
        const expiresAt = new Date(new Date(entry.createdAt).getTime() + entry.ttlSeconds * 1000);
        console.log(`  ${entry.key}: ${entry.ttlSeconds}s | expires ${expiresAt.toISOString()} [${expired ? "EXPIRED" : "active"}]`);
      });
    });
}
