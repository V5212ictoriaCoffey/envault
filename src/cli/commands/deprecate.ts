import { Command } from "commander";
import * as path from "path";
import {
  deprecateKey,
  undeprecateKey,
  listDeprecated,
  formatDeprecations,
  loadDeprecateStore,
  isDeprecated,
} from "../../vault/vaultDeprecate";

export function registerDeprecateCommand(program: Command): void {
  const cmd = program
    .command("deprecate")
    .description("Manage deprecated vault keys");

  cmd
    .command("mark <key>")
    .description("Mark a key as deprecated")
    .option("-r, --reason <reason>", "Reason for deprecation")
    .option("--replaced-by <key>", "Key that replaces this one")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action((key: string, opts: { reason?: string; replacedBy?: string; dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      if (isDeprecated(vaultDir, key)) {
        console.log(`Key "${key}" is already deprecated.`);
        return;
      }
      deprecateKey(vaultDir, key, opts.reason, opts.replacedBy);
      console.log(`Key "${key}" marked as deprecated.`);
      if (opts.reason) console.log(`  Reason: ${opts.reason}`);
      if (opts.replacedBy) console.log(`  Replaced by: ${opts.replacedBy}`);
    });

  cmd
    .command("unmark <key>")
    .description("Remove deprecation from a key")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action((key: string, opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      if (!isDeprecated(vaultDir, key)) {
        console.log(`Key "${key}" is not deprecated.`);
        return;
      }
      undeprecateKey(vaultDir, key);
      console.log(`Deprecation removed from key "${key}".`);
    });

  cmd
    .command("list")
    .description("List all deprecated keys")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action((opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      const keys = listDeprecated(vaultDir);
      if (keys.length === 0) {
        console.log("No deprecated keys.");
        return;
      }
      const store = loadDeprecateStore(vaultDir);
      console.log(formatDeprecations(store));
    });
}
