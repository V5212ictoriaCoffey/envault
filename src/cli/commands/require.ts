import { Command } from "commander";
import * as path from "path";
import {
  requireKey,
  unrequireKey,
  listRequiredKeys,
  validateRequiredKeys,
} from "../../vault/vaultRequire";
import { loadVault } from "../../vault";

export function registerRequireCommand(program: Command): void {
  const require = program
    .command("require")
    .description("Manage required vault keys");

  require
    .command("add <key>")
    .description("Mark a key as required")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action((key: string, opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      requireKey(vaultDir, key);
      console.log(`✔ Key "${key}" marked as required.`);
    });

  require
    .command("remove <key>")
    .description("Unmark a key as required")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action((key: string, opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      unrequireKey(vaultDir, key);
      console.log(`✔ Key "${key}" removed from required list.`);
    });

  require
    .command("list")
    .description("List all required keys")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action((opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      const keys = listRequiredKeys(vaultDir);
      if (keys.length === 0) {
        console.log("No required keys defined.");
      } else {
        console.log("Required keys:");
        keys.forEach((k) => console.log(`  - ${k}`));
      }
    });

  require
    .command("check")
    .description("Validate that all required keys exist in the vault")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action((opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      const vault = loadVault(vaultDir);
      const presentKeys = Object.keys(vault.data);
      const missing = validateRequiredKeys(vaultDir, presentKeys);
      if (missing.length === 0) {
        console.log("✔ All required keys are present.");
      } else {
        console.error("✘ Missing required keys:");
        missing.forEach((k) => console.error(`  - ${k}`));
        process.exit(1);
      }
    });
}
