import { Command } from "commander";
import * as path from "path";
import * as fs from "fs";
import { watchVault, formatWatchLog, getWatchablePath } from "../../vault/vaultWatch";
import { loadVault } from "../../vault";

export function registerWatchCommand(program: Command): void {
  program
    .command("watch")
    .description("Watch the vault for key changes and log them to stdout")
    .option("-d, --dir <path>", "vault directory", process.cwd())
    .option("-q, --quiet", "suppress startup message", false)
    .action((options: { dir: string; quiet: boolean }) => {
      const vaultDir = path.resolve(options.dir);
      const vaultPath = getWatchablePath(vaultDir);

      if (!fs.existsSync(vaultPath)) {
        console.error(`No vault found at ${vaultPath}. Run 'envault init' first.`);
        process.exit(1);
      }

      function readVaultKeys(): Record<string, string> {
        try {
          const vault = loadVault(vaultDir);
          return Object.fromEntries(
            Object.entries(vault.records).map(([k, v]) => [k, v.encrypted])
          );
        } catch {
          return {};
        }
      }

      if (!options.quiet) {
        console.log(`Watching vault at ${vaultPath} for changes...`);
        console.log("Press Ctrl+C to stop.\n");
      }

      const watcher = watchVault(vaultPath, readVaultKeys, (entries) => {
        const log = formatWatchLog(entries);
        console.log(log);
      });

      process.on("SIGINT", () => {
        watcher.close();
        if (!options.quiet) {
          console.log("\nStopped watching.");
        }
        process.exit(0);
      });
    });
}
