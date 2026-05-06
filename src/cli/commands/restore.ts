import { Command } from "commander";
import * as path from "path";
import { listBackups, restoreBackup } from "../../vault/vaultBackup";
import { loadVault } from "../../vault";

export function registerRestoreCommand(program: Command): void {
  program
    .command("restore")
    .description("Restore the vault from a backup")
    .option("-v, --vault <path>", "Path to vault file", ".envault")
    .option("-l, --list", "List available backups")
    .option("-b, --backup <filename>", "Backup filename to restore")
    .option("-f, --force", "Skip confirmation prompt")
    .action(async (options) => {
      const vaultPath = path.resolve(options.vault);

      const backups = await listBackups(vaultPath);

      if (backups.length === 0) {
        console.error("No backups found for this vault.");
        process.exit(1);
      }

      if (options.list) {
        console.log("Available backups:");
        backups.forEach((b, i) => {
          console.log(`  [${i + 1}] ${b}`);
        });
        return;
      }

      let targetBackup: string;

      if (options.backup) {
        if (!backups.includes(options.backup)) {
          console.error(`Backup not found: ${options.backup}`);
          console.error("Run with --list to see available backups.");
          process.exit(1);
        }
        targetBackup = options.backup;
      } else {
        targetBackup = backups[backups.length - 1];
        console.log(`No backup specified. Using latest: ${targetBackup}`);
      }

      if (!options.force) {
        const readline = await import("readline");
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await new Promise<string>((resolve) =>
          rl.question(`Restore vault from "${targetBackup}"? This will overwrite the current vault. (y/N): `, resolve)
        );
        rl.close();
        if (answer.trim().toLowerCase() !== "y") {
          console.log("Restore cancelled.");
          return;
        }
      }

      await restoreBackup(vaultPath, targetBackup);
      const vault = await loadVault(vaultPath);
      console.log(`✔ Vault restored from "${targetBackup}" (${Object.keys(vault.records).length} records).`);
    });
}
