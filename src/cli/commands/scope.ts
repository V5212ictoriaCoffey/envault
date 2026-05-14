import { Command } from "commander";
import * as path from "path";
import {
  setScope,
  removeScope,
  getScope,
  getKeysByScope,
  loadScopeStore,
  formatScopeList,
  ScopeLevel,
} from "../../vault/vaultScope";

const VALID_LEVELS: ScopeLevel[] = ["local", "shared", "global"];

export function registerScopeCommand(program: Command): void {
  const scope = program
    .command("scope")
    .description("Manage scope levels for vault keys");

  scope
    .command("set <key> <level>")
    .description("Set scope level for a key (local | shared | global)")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action((key: string, level: string, opts: { dir: string }) => {
      if (!VALID_LEVELS.includes(level as ScopeLevel)) {
        console.error(`Invalid scope level: "${level}". Must be one of: ${VALID_LEVELS.join(", ")}`);
        process.exit(1);
      }
      setScope(opts.dir, key, level as ScopeLevel);
      console.log(`Scope for "${key}" set to "${level}".`);
    });

  scope
    .command("get <key>")
    .description("Get scope level for a key")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action((key: string, opts: { dir: string }) => {
      const level = getScope(opts.dir, key);
      if (!level) {
        console.log(`No scope assigned to "${key}".`);
      } else {
        console.log(`${key}: ${level}`);
      }
    });

  scope
    .command("remove <key>")
    .description("Remove scope assignment from a key")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action((key: string, opts: { dir: string }) => {
      removeScope(opts.dir, key);
      console.log(`Scope removed from "${key}".`);
    });

  scope
    .command("list")
    .description("List all scope assignments")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .option("-l, --level <level>", "Filter by scope level")
    .action((opts: { dir: string; level?: string }) => {
      if (opts.level) {
        if (!VALID_LEVELS.includes(opts.level as ScopeLevel)) {
          console.error(`Invalid scope level: "${opts.level}".`);
          process.exit(1);
        }
        const keys = getKeysByScope(opts.dir, opts.level as ScopeLevel);
        if (keys.length === 0) {
          console.log(`No keys with scope "${opts.level}".`);
        } else {
          keys.forEach((k) => console.log(`  ${k}`));
        }
      } else {
        const store = loadScopeStore(opts.dir);
        console.log(formatScopeList(store));
      }
    });
}
