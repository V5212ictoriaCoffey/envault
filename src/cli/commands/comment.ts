import { Command } from "commander";
import * as path from "path";
import {
  loadCommentStore,
  saveCommentStore,
  setComment,
  removeComment,
  getComment,
} from "../../vault/vaultComment";

export function registerCommentCommand(program: Command): void {
  const comment = program
    .command("comment")
    .description("Manage inline comments for vault keys");

  comment
    .command("set <key> <text>")
    .description("Set a comment for a vault key")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action(async (key: string, text: string, opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      const store = loadCommentStore(vaultDir);
      const updated = setComment(store, key, text);
      saveCommentStore(vaultDir, updated);
      console.log(`Comment set for "${key}": ${text}`);
    });

  comment
    .command("remove <key>")
    .description("Remove the comment for a vault key")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action(async (key: string, opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      const store = loadCommentStore(vaultDir);
      const updated = removeComment(store, key);
      saveCommentStore(vaultDir, updated);
      console.log(`Comment removed for "${key}".`);
    });

  comment
    .command("get <key>")
    .description("Get the comment for a vault key")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action(async (key: string, opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      const store = loadCommentStore(vaultDir);
      const text = getComment(store, key);
      if (text) {
        console.log(`${key}: ${text}`);
      } else {
        console.log(`No comment found for "${key}".`);
      }
    });

  comment
    .command("list")
    .description("List all key comments")
    .option("-d, --dir <dir>", "Vault directory", ".")
    .action(async (opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      const store = loadCommentStore(vaultDir);
      const entries = Object.entries(store.comments);
      if (entries.length === 0) {
        console.log("No comments found.");
        return;
      }
      for (const [key, text] of entries) {
        console.log(`  ${key}: ${text}`);
      }
    });
}
