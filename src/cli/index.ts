#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init";

const program = new Command();

program
  .name("envault")
  .description("Encrypt and sync .env files using asymmetric keys")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize a new envault vault and generate a key pair")
  .option("-k, --key-dir <path>", "Directory to store key pair", ".envault-keys")
  .option("-v, --vault-file <path>", "Path for the vault file", ".envault")
  .option("-f, --force", "Overwrite existing vault and keys", false)
  .action(async (opts) => {
    try {
      await initCommand({
        keyDir: opts.keyDir,
        vaultFile: opts.vaultFile,
        force: opts.force,
      });
    } catch (err) {
      console.error("Error:", (err as Error).message);
      process.exit(1);
    }
  });

program.parseAsync(process.argv);
