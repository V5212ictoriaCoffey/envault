import { Command } from "commander";
import path from "path";
import {
  setVisibility,
  removeVisibility,
  getVisibility,
  listByVisibility,
  loadVisibilityStore,
  VisibilityLevel,
} from "../../vault/vaultVisibility";

const VALID_LEVELS: VisibilityLevel[] = ["public", "private", "secret"];

export function registerVisibilityCommand(program: Command): void {
  const visibility = program
    .command("visibility")
    .description("Manage key visibility levels (public | private | secret)");

  visibility
    .command("set <key> <level>")
    .description("Set visibility level for a key")
    .option("--vault-dir <dir>", "Vault directory", process.cwd())
    .action((key: string, level: string, opts: { vaultDir: string }) => {
      if (!VALID_LEVELS.includes(level as VisibilityLevel)) {
        console.error(`Invalid level "${level}". Must be one of: ${VALID_LEVELS.join(", ")}`);
        process.exit(1);
      }
      setVisibility(opts.vaultDir, key, level as VisibilityLevel);
      console.log(`Visibility for "${key}" set to "${level}".`);
    });

  visibility
    .command("get <key>")
    .description("Get visibility level for a key")
    .option("--vault-dir <dir>", "Vault directory", process.cwd())
    .action((key: string, opts: { vaultDir: string }) => {
      const level = getVisibility(opts.vaultDir, key);
      console.log(`${key}: ${level}`);
    });

  visibility
    .command("remove <key>")
    .description("Remove visibility override for a key")
    .option("--vault-dir <dir>", "Vault directory", process.cwd())
    .action((key: string, opts: { vaultDir: string }) => {
      removeVisibility(opts.vaultDir, key);
      console.log(`Visibility override removed for "${key}".`);
    });

  visibility
    .command("list [level]")
    .description("List all keys, optionally filtered by level")
    .option("--vault-dir <dir>", "Vault directory", process.cwd())
    .action((level: string | undefined, opts: { vaultDir: string }) => {
      if (level) {
        if (!VALID_LEVELS.includes(level as VisibilityLevel)) {
          console.error(`Invalid level "${level}". Must be one of: ${VALID_LEVELS.join(", ")}`);
          process.exit(1);
        }
        const keys = listByVisibility(opts.vaultDir, level as VisibilityLevel);
        if (keys.length === 0) {
          console.log(`No keys with visibility "${level}".`);
        } else {
          keys.forEach((k) => console.log(`  ${k}: ${level}`));
        }
      } else {
        const store = loadVisibilityStore(opts.vaultDir);
        const entries = Object.entries(store);
        if (entries.length === 0) {
          console.log("No visibility overrides set.");
        } else {
          entries.forEach(([k, v]) => console.log(`  ${k}: ${v}`));
        }
      }
    });
}
