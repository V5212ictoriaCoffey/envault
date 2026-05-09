import { Command } from "commander";
import {
  addDependency,
  removeDependency,
  getDependencies,
  getDependents,
  clearDependencies,
} from "../../vault/vaultDependency";

export function registerDependencyCommand(program: Command): void {
  const dep = program
    .command("dependency")
    .description("Manage key dependencies within the vault");

  dep
    .command("add <key> <dependsOn>")
    .description("Mark <key> as depending on <dependsOn>")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action((key: string, dependsOn: string, opts: { dir: string }) => {
      addDependency(opts.dir, key, dependsOn);
      console.log(`Added dependency: ${key} → ${dependsOn}`);
    });

  dep
    .command("remove <key> <dependsOn>")
    .description("Remove a dependency from <key>")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action((key: string, dependsOn: string, opts: { dir: string }) => {
      removeDependency(opts.dir, key, dependsOn);
      console.log(`Removed dependency: ${key} → ${dependsOn}`);
    });

  dep
    .command("list <key>")
    .description("List dependencies of <key>")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action((key: string, opts: { dir: string }) => {
      const deps = getDependencies(opts.dir, key);
      if (deps.length === 0) {
        console.log(`No dependencies for "${key}".`);
      } else {
        console.log(`Dependencies of "${key}":`);
        deps.forEach((d) => console.log(`  - ${d}`));
      }
    });

  dep
    .command("dependents <key>")
    .description("List keys that depend on <key>")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action((key: string, opts: { dir: string }) => {
      const dependents = getDependents(opts.dir, key);
      if (dependents.length === 0) {
        console.log(`No keys depend on "${key}".`);
      } else {
        console.log(`Keys depending on "${key}":`);
        dependents.forEach((d) => console.log(`  - ${d}`));
      }
    });

  dep
    .command("clear <key>")
    .description("Clear all dependencies for <key>")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action((key: string, opts: { dir: string }) => {
      clearDependencies(opts.dir, key);
      console.log(`Cleared all dependencies for "${key}".`);
    });
}
