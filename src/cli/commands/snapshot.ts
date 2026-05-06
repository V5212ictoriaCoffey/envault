import { Command } from "commander";
import * as path from "path";
import { loadVault } from "../../vault/vault";
import {
  createSnapshot,
  deleteSnapshot,
  getSnapshot,
  listSnapshots,
} from "../../vault/vaultSnapshot";
import { saveVault } from "../../vault/vault";

const DEFAULT_VAULT = ".envault";

export function registerSnapshotCommand(program: Command): void {
  const snap = program.command("snapshot").description("Manage vault snapshots");

  snap
    .command("create <label>")
    .description("Create a named snapshot of the current vault")
    .option("-d, --dir <dir>", "Vault directory", DEFAULT_VAULT)
    .action(async (label: string, opts: { dir: string }) => {
      const vault = loadVault(opts.dir);
      const id = createSnapshot(opts.dir, vault, label);
      console.log(`Snapshot created: ${id} ("${label}")`);
    });

  snap
    .command("list")
    .description("List all snapshots")
    .option("-d, --dir <dir>", "Vault directory", DEFAULT_VAULT)
    .action((opts: { dir: string }) => {
      const entries = listSnapshots(opts.dir);
      if (entries.length === 0) {
        console.log("No snapshots found.");
        return;
      }
      entries.forEach((e) => {
        console.log(`${e.id}  [${e.label}]  ${e.createdAt}  (${e.keys.length} keys)`);
      });
    });

  snap
    .command("restore <id>")
    .description("Restore vault from a snapshot")
    .option("-d, --dir <dir>", "Vault directory", DEFAULT_VAULT)
    .action((id: string, opts: { dir: string }) => {
      const vault = getSnapshot(opts.dir, id);
      if (!vault) {
        console.error(`Snapshot "${id}" not found.`);
        process.exit(1);
      }
      saveVault(opts.dir, vault);
      console.log(`Vault restored from snapshot ${id}.`);
    });

  snap
    .command("delete <id>")
    .description("Delete a snapshot")
    .option("-d, --dir <dir>", "Vault directory", DEFAULT_VAULT)
    .action((id: string, opts: { dir: string }) => {
      const ok = deleteSnapshot(opts.dir, id);
      if (!ok) {
        console.error(`Snapshot "${id}" not found.`);
        process.exit(1);
      }
      console.log(`Snapshot ${id} deleted.`);
    });
}
