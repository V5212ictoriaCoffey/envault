import { Command } from "commander";
import * as path from "path";
import {
  appendHistoryEntry,
  getKeyHistory,
  clearHistory,
  formatHistory,
  loadHistoryStore,
} from "../../vault/vaultHistory";

export function registerHistoryCommand(program: Command): void {
  const history = program
    .command("history")
    .description("View or manage key change history");

  history
    .command("list [key]")
    .description("List history entries, optionally filtered by key")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action((key: string | undefined, opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      if (key) {
        const entries = getKeyHistory(vaultDir, key);
        console.log(formatHistory(entries));
      } else {
        const store = loadHistoryStore(vaultDir);
        console.log(formatHistory(store.entries));
      }
    });

  history
    .command("add <key> <action>")
    .description("Manually append a history entry (set | delete | rotate)")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .option("-a, --actor <actor>", "Actor name")
    .action(
      (
        key: string,
        action: string,
        opts: { dir: string; actor?: string }
      ) => {
        const validActions = ["set", "delete", "rotate"];
        if (!validActions.includes(action)) {
          console.error(`Invalid action. Use one of: ${validActions.join(", ")}`);
          process.exit(1);
        }
        const vaultDir = path.resolve(opts.dir);
        appendHistoryEntry(
          vaultDir,
          key,
          action as "set" | "delete" | "rotate",
          opts.actor
        );
        console.log(`History entry added for key "${key}" (${action}).`);
      }
    );

  history
    .command("clear")
    .description("Clear all history entries")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action((opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      clearHistory(vaultDir);
      console.log("History cleared.");
    });
}
