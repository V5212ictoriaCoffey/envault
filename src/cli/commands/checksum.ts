import { Command } from "commander";
import * as path from "path";
import {
  setChecksum,
  removeChecksum,
  verifyChecksum,
  loadChecksumStore,
  detectTamperedKeys,
} from "../../vault/vaultChecksum";
import { loadVault } from "../../vault/vault";

export function registerChecksumCommand(program: Command): void {
  const checksum = program
    .command("checksum")
    .description("Manage and verify vault entry checksums");

  checksum
    .command("set <key> <encryptedValue>")
    .description("Record a checksum for a vault key")
    .option("--vault-dir <dir>", "Vault directory", ".")
    .action((key: string, encryptedValue: string, opts: { vaultDir: string }) => {
      setChecksum(opts.vaultDir, key, encryptedValue);
      console.log(`Checksum recorded for key: ${key}`);
    });

  checksum
    .command("remove <key>")
    .description("Remove the checksum for a vault key")
    .option("--vault-dir <dir>", "Vault directory", ".")
    .action((key: string, opts: { vaultDir: string }) => {
      removeChecksum(opts.vaultDir, key);
      console.log(`Checksum removed for key: ${key}`);
    });

  checksum
    .command("verify <key> <encryptedValue>")
    .description("Verify the checksum of a vault key against a value")
    .option("--vault-dir <dir>", "Vault directory", ".")
    .action((key: string, encryptedValue: string, opts: { vaultDir: string }) => {
      const valid = verifyChecksum(opts.vaultDir, key, encryptedValue);
      if (valid) {
        console.log(`✔ Checksum valid for key: ${key}`);
      } else {
        console.error(`✘ Checksum mismatch or missing for key: ${key}`);
        process.exit(1);
      }
    });

  checksum
    .command("list")
    .description("List all stored checksums")
    .option("--vault-dir <dir>", "Vault directory", ".")
    .action((opts: { vaultDir: string }) => {
      const store = loadChecksumStore(opts.vaultDir);
      const keys = Object.keys(store);
      if (keys.length === 0) {
        console.log("No checksums stored.");
        return;
      }
      keys.forEach((k) => console.log(`${k}: ${store[k]}`));
    });

  checksum
    .command("audit")
    .description("Detect tampered vault entries by comparing checksums")
    .option("--vault-dir <dir>", "Vault directory", ".")
    .option("--vault-file <file>", "Vault file name", ".envault")
    .action((opts: { vaultDir: string; vaultFile: string }) => {
      const vaultPath = path.join(opts.vaultDir, opts.vaultFile);
      const vault = loadVault(vaultPath);
      const tampered = detectTamperedKeys(vault, opts.vaultDir);
      if (tampered.length === 0) {
        console.log("✔ All checksums match. No tampering detected.");
      } else {
        console.error(`✘ Tampered keys detected: ${tampered.join(", ")}`);
        process.exit(1);
      }
    });
}
