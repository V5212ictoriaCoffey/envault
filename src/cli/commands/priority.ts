import { Command } from "commander";
import {
  setPriority,
  removePriority,
  getPriority,
  listByPriority,
  loadPriorityStore,
  PriorityLevel,
} from "../../vault/vaultPriority";

const VALID_LEVELS: PriorityLevel[] = ["critical", "high", "medium", "low"];

export function registerPriorityCommand(program: Command, vaultDir: string): void {
  const priority = program
    .command("priority")
    .description("Manage priority levels for vault keys");

  priority
    .command("set <key> <level>")
    .description(`Set priority for a key (${VALID_LEVELS.join(" | ")})`) 
    .action((key: string, level: string) => {
      if (!VALID_LEVELS.includes(level as PriorityLevel)) {
        console.error(`Invalid priority level: "${level}". Must be one of: ${VALID_LEVELS.join(", ")}`);
        process.exit(1);
      }
      setPriority(vaultDir, key, level as PriorityLevel);
      console.log(`Priority for "${key}" set to "${level}".`);
    });

  priority
    .command("remove <key>")
    .description("Remove priority from a key")
    .action((key: string) => {
      removePriority(vaultDir, key);
      console.log(`Priority removed from "${key}".`);
    });

  priority
    .command("get <key>")
    .description("Get the priority level of a key")
    .action((key: string) => {
      const level = getPriority(vaultDir, key);
      if (!level) {
        console.log(`No priority set for "${key}".`);
      } else {
        console.log(`${key}: ${level}`);
      }
    });

  priority
    .command("list [level]")
    .description("List all keys or keys matching a priority level")
    .action((level?: string) => {
      if (level) {
        if (!VALID_LEVELS.includes(level as PriorityLevel)) {
          console.error(`Invalid priority level: "${level}".`);
          process.exit(1);
        }
        const keys = listByPriority(vaultDir, level as PriorityLevel);
        if (keys.length === 0) {
          console.log(`No keys with priority "${level}".`);
        } else {
          keys.forEach((k) => console.log(`  ${k} [${level}]`));
        }
      } else {
        const store = loadPriorityStore(vaultDir);
        const entries = Object.entries(store);
        if (entries.length === 0) {
          console.log("No priority assignments found.");
        } else {
          entries.forEach(([k, v]) => console.log(`  ${k}: ${v}`));
        }
      }
    });
}
