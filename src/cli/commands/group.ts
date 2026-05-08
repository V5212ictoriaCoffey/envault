import { Command } from "commander";
import path from "path";
import {
  createGroup,
  deleteGroup,
  addKeyToGroup,
  removeKeyFromGroup,
  listGroups,
  getGroupKeys,
} from "../../vault/vaultGroup";

export function registerGroupCommand(program: Command): void {
  const group = program.command("group").description("Manage vault key groups");

  group
    .command("create <name>")
    .description("Create a new group")
    .option("--vault-dir <dir>", "Vault directory", ".")
    .action((name: string, opts: { vaultDir: string }) => {
      try {
        createGroup(path.resolve(opts.vaultDir), name);
        console.log(`Group "${name}" created.`);
      } catch (e: any) {
        console.error(e.message);
        process.exit(1);
      }
    });

  group
    .command("delete <name>")
    .description("Delete a group")
    .option("--vault-dir <dir>", "Vault directory", ".")
    .action((name: string, opts: { vaultDir: string }) => {
      try {
        deleteGroup(path.resolve(opts.vaultDir), name);
        console.log(`Group "${name}" deleted.`);
      } catch (e: any) {
        console.error(e.message);
        process.exit(1);
      }
    });

  group
    .command("add <groupName> <key>")
    .description("Add a key to a group")
    .option("--vault-dir <dir>", "Vault directory", ".")
    .action((groupName: string, key: string, opts: { vaultDir: string }) => {
      try {
        addKeyToGroup(path.resolve(opts.vaultDir), groupName, key);
        console.log(`Key "${key}" added to group "${groupName}".`);
      } catch (e: any) {
        console.error(e.message);
        process.exit(1);
      }
    });

  group
    .command("remove <groupName> <key>")
    .description("Remove a key from a group")
    .option("--vault-dir <dir>", "Vault directory", ".")
    .action((groupName: string, key: string, opts: { vaultDir: string }) => {
      try {
        removeKeyFromGroup(path.resolve(opts.vaultDir), groupName, key);
        console.log(`Key "${key}" removed from group "${groupName}".`);
      } catch (e: any) {
        console.error(e.message);
        process.exit(1);
      }
    });

  group
    .command("list")
    .description("List all groups")
    .option("--vault-dir <dir>", "Vault directory", ".")
    .action((opts: { vaultDir: string }) => {
      const groups = listGroups(path.resolve(opts.vaultDir));
      if (groups.length === 0) return console.log("No groups defined.");
      groups.forEach((g) => console.log(`  ${g}`));
    });

  group
    .command("show <name>")
    .description("Show keys in a group")
    .option("--vault-dir <dir>", "Vault directory", ".")
    .action((name: string, opts: { vaultDir: string }) => {
      try {
        const keys = getGroupKeys(path.resolve(opts.vaultDir), name);
        if (keys.length === 0) return console.log(`Group "${name}" is empty.`);
        keys.forEach((k) => console.log(`  ${k}`));
      } catch (e: any) {
        console.error(e.message);
        process.exit(1);
      }
    });
}
