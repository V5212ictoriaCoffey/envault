import { Command } from "commander";
import {
  setOwner,
  removeOwner,
  getOwner,
  listOwners,
  getKeysByOwner,
} from "../../vault/vaultOwner";

export function registerOwnerCommand(program: Command, vaultDir: string): void {
  const owner = program
    .command("owner")
    .description("Manage key ownership assignments");

  owner
    .command("set <key> <owner>")
    .description("Assign an owner to a vault key")
    .action((key: string, ownerName: string) => {
      const entry = setOwner(vaultDir, key, ownerName);
      console.log(`Owner set: ${entry.key} → ${entry.owner} (at ${entry.assignedAt})`);
    });

  owner
    .command("remove <key>")
    .description("Remove the owner assignment from a key")
    .action((key: string) => {
      const removed = removeOwner(vaultDir, key);
      if (removed) {
        console.log(`Owner removed from key: ${key}`);
      } else {
        console.warn(`No owner found for key: ${key}`);
        process.exitCode = 1;
      }
    });

  owner
    .command("get <key>")
    .description("Show the owner of a specific key")
    .action((key: string) => {
      const entry = getOwner(vaultDir, key);
      if (!entry) {
        console.warn(`No owner assigned to key: ${key}`);
        process.exitCode = 1;
        return;
      }
      console.log(`${entry.key}: ${entry.owner} (assigned ${entry.assignedAt})`);
    });

  owner
    .command("list")
    .description("List all key ownership assignments")
    .action(() => {
      const entries = listOwners(vaultDir);
      if (entries.length === 0) {
        console.log("No ownership assignments found.");
        return;
      }
      entries.forEach((e) => {
        console.log(`  ${e.key.padEnd(30)} ${e.owner.padEnd(20)} ${e.assignedAt}`);
      });
    });

  owner
    .command("by <ownerName>")
    .description("List all keys owned by a specific user")
    .action((ownerName: string) => {
      const keys = getKeysByOwner(vaultDir, ownerName);
      if (keys.length === 0) {
        console.log(`No keys owned by: ${ownerName}`);
        return;
      }
      console.log(`Keys owned by ${ownerName}:`);
      keys.forEach((k) => console.log(`  - ${k}`));
    });
}
