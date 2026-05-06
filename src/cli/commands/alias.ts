import { Command } from "commander";
import {
  addAlias,
  removeAlias,
  listAliases,
  resolveAlias,
} from "../../vault/vaultAlias";

export function registerAliasCommand(program: Command): void {
  const alias = program
    .command("alias")
    .description("Manage key aliases in the vault");

  alias
    .command("add <alias> <key>")
    .description("Add an alias that maps to an existing vault key")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action((aliasName: string, key: string, opts: { dir: string }) => {
      addAlias(opts.dir, aliasName, key);
      console.log(`Alias "${aliasName}" -> "${key}" added.`);
    });

  alias
    .command("remove <alias>")
    .description("Remove an alias")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action((aliasName: string, opts: { dir: string }) => {
      removeAlias(opts.dir, aliasName);
      console.log(`Alias "${aliasName}" removed.`);
    });

  alias
    .command("list")
    .description("List all aliases")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action((opts: { dir: string }) => {
      const entries = listAliases(opts.dir);
      if (entries.length === 0) {
        console.log("No aliases defined.");
        return;
      }
      entries.forEach(({ alias, key }) => {
        console.log(`  ${alias} -> ${key}`);
      });
    });

  alias
    .command("resolve <alias>")
    .description("Resolve an alias to its vault key")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action((aliasName: string, opts: { dir: string }) => {
      const resolved = resolveAlias(opts.dir, aliasName);
      console.log(resolved);
    });
}
