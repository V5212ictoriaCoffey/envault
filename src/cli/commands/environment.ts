import { Command } from "commander";
import {
  addKeyToEnvironment,
  removeKeyFromEnvironment,
  deleteEnvironment,
  listEnvironments,
  getKeysForEnvironment,
} from "../../vault/vaultEnvironment";

export function registerEnvironmentCommand(program: Command): void {
  const env = program
    .command("environment")
    .alias("env")
    .description("Manage key-to-environment mappings");

  env
    .command("add <environment> <key>")
    .description("Assign a vault key to an environment")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action((environment: string, key: string, opts: { dir: string }) => {
      addKeyToEnvironment(opts.dir, environment, key);
      console.log(`Key "${key}" added to environment "${environment}".`);
    });

  env
    .command("remove <environment> <key>")
    .description("Remove a vault key from an environment")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action((environment: string, key: string, opts: { dir: string }) => {
      removeKeyFromEnvironment(opts.dir, environment, key);
      console.log(`Key "${key}" removed from environment "${environment}".`);
    });

  env
    .command("delete <environment>")
    .description("Delete an entire environment mapping")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action((environment: string, opts: { dir: string }) => {
      deleteEnvironment(opts.dir, environment);
      console.log(`Environment "${environment}" deleted.`);
    });

  env
    .command("list")
    .description("List all environments")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action((opts: { dir: string }) => {
      const envs = listEnvironments(opts.dir);
      if (envs.length === 0) {
        console.log("No environments defined.");
      } else {
        console.log("Environments:");
        envs.forEach((e) => console.log(`  - ${e}`));
      }
    });

  env
    .command("keys <environment>")
    .description("List keys assigned to an environment")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action((environment: string, opts: { dir: string }) => {
      const keys = getKeysForEnvironment(opts.dir, environment);
      if (keys.length === 0) {
        console.log(`No keys assigned to environment "${environment}".`);
      } else {
        console.log(`Keys in "${environment}":`);
        keys.forEach((k) => console.log(`  - ${k}`));
      }
    });
}
