import { Command } from "commander";
import path from "path";
import { setNote, removeNote, getNote, listNotes } from "../../vault/vaultNote";

export function registerNoteCommand(program: Command): void {
  const note = program
    .command("note")
    .description("Manage inline notes for vault keys");

  note
    .command("set <key> <message>")
    .description("Attach a note to a vault key")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action((key: string, message: string, opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      setNote(vaultDir, key, message);
      console.log(`Note set for "${key}".`);
    });

  note
    .command("get <key>")
    .description("Show the note for a vault key")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action((key: string, opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      const msg = getNote(vaultDir, key);
      if (msg === undefined) {
        console.log(`No note found for "${key}".`);
      } else {
        console.log(`${key}: ${msg}`);
      }
    });

  note
    .command("remove <key>")
    .description("Remove the note from a vault key")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action((key: string, opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      removeNote(vaultDir, key);
      console.log(`Note removed for "${key}".`);
    });

  note
    .command("list")
    .description("List all notes in the vault")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action((opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      const notes = listNotes(vaultDir);
      const entries = Object.entries(notes);
      if (entries.length === 0) {
        console.log("No notes found.");
        return;
      }
      entries.forEach(([key, msg]) => {
        console.log(`  ${key}: ${msg}`);
      });
    });
}
