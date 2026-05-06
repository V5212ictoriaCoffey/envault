import { Command } from "commander";
import * as path from "path";
import { addTag, removeTag, listTags, getKeysForTag } from "../../vault/vaultTag";

export function registerTagCommand(program: Command): void {
  const tag = program
    .command("tag")
    .description("Manage tags for grouping vault keys");

  tag
    .command("add <tagName> [keys...]")
    .description("Create or update a tag with the given keys")
    .option("--vault-dir <dir>", "Path to vault directory", ".")
    .action((tagName: string, keys: string[], opts: { vaultDir: string }) => {
      const vaultDir = path.resolve(opts.vaultDir);
      if (!keys || keys.length === 0) {
        console.error("Error: at least one key is required.");
        process.exit(1);
      }
      const created = addTag(vaultDir, tagName, keys);
      console.log(`Tag "${created.name}" saved with keys: ${created.keys.join(", ")}`);
    });

  tag
    .command("remove <tagName>")
    .description("Remove a tag by name")
    .option("--vault-dir <dir>", "Path to vault directory", ".")
    .action((tagName: string, opts: { vaultDir: string }) => {
      const vaultDir = path.resolve(opts.vaultDir);
      const removed = removeTag(vaultDir, tagName);
      if (removed) {
        console.log(`Tag "${tagName}" removed.`);
      } else {
        console.error(`Tag "${tagName}" not found.`);
        process.exit(1);
      }
    });

  tag
    .command("list")
    .description("List all tags")
    .option("--vault-dir <dir>", "Path to vault directory", ".")
    .action((opts: { vaultDir: string }) => {
      const vaultDir = path.resolve(opts.vaultDir);
      const tags = listTags(vaultDir);
      if (tags.length === 0) {
        console.log("No tags defined.");
        return;
      }
      tags.forEach((t) => {
        console.log(`  ${t.name} (${t.keys.length} key${t.keys.length !== 1 ? "s" : ""}): ${t.keys.join(", ")}`);
      });
    });

  tag
    .command("show <tagName>")
    .description("Show keys associated with a tag")
    .option("--vault-dir <dir>", "Path to vault directory", ".")
    .action((tagName: string, opts: { vaultDir: string }) => {
      const vaultDir = path.resolve(opts.vaultDir);
      const keys = getKeysForTag(vaultDir, tagName);
      if (keys.length === 0) {
        console.log(`Tag "${tagName}" has no keys or does not exist.`);
        return;
      }
      console.log(`Keys for "${tagName}":`);
      keys.forEach((k) => console.log(`  - ${k}`));
    });
}
