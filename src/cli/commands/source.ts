import { Command } from "commander";
import {
  setSource,
  removeSource,
  getSource,
  listSources,
  getKeysBySource,
} from "../../vault/vaultSource";

export function registerSourceCommand(program: Command): void {
  const source = program
    .command("source")
    .description("Manage the origin source for vault keys");

  source
    .command("set <key> <source>")
    .description("Assign a source to a vault key")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action((key: string, src: string, opts: { dir: string }) => {
      const entry = setSource(opts.dir, key, src);
      console.log(`Source set: ${entry.key} → ${entry.source} (${entry.addedAt})`);
    });

  source
    .command("get <key>")
    .description("Show the source assigned to a vault key")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action((key: string, opts: { dir: string }) => {
      const entry = getSource(opts.dir, key);
      if (!entry) {
        console.log(`No source found for key: ${key}`);
        return;
      }
      console.log(`${entry.key}: ${entry.source} (added ${entry.addedAt})`);
    });

  source
    .command("remove <key>")
    .description("Remove the source assignment from a vault key")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action((key: string, opts: { dir: string }) => {
      const removed = removeSource(opts.dir, key);
      if (removed) {
        console.log(`Source removed for key: ${key}`);
      } else {
        console.log(`No source entry found for key: ${key}`);
      }
    });

  source
    .command("list")
    .description("List all source assignments")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .option("-s, --source <source>", "Filter by source name")
    .action((opts: { dir: string; source?: string }) => {
      if (opts.source) {
        const keys = getKeysBySource(opts.dir, opts.source);
        if (keys.length === 0) {
          console.log(`No keys found for source: ${opts.source}`);
          return;
        }
        keys.forEach((k) => console.log(k));
      } else {
        const entries = listSources(opts.dir);
        if (entries.length === 0) {
          console.log("No source assignments found.");
          return;
        }
        entries.forEach((e) => console.log(`${e.key}: ${e.source}`));
      }
    });
}
