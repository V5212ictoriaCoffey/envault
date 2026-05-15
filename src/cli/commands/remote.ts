import { Command } from "commander";
import {
  addRemote,
  removeRemote,
  listRemotes,
  getRemote,
  updateLastSynced,
  RemoteConfig,
} from "../../vault/vaultRemote";

export function registerRemoteCommand(program: Command): void {
  const remote = program
    .command("remote")
    .description("Manage vault remote endpoints for sync");

  remote
    .command("add <name> <url>")
    .description("Add a named remote endpoint")
    .option("-p, --provider <provider>", "Provider type (s3|gcs|http|custom)", "http")
    .option("-H, --header <header>", "Extra headers in key=value format", (v, prev: string[]) => [...prev, v], [] as string[])
    .action((name: string, url: string, opts: { provider: string; header: string[] }) => {
      const headers: Record<string, string> = {};
      for (const h of opts.header) {
        const idx = h.indexOf("=");
        if (idx !== -1) headers[h.slice(0, idx)] = h.slice(idx + 1);
      }
      const config: RemoteConfig = {
        url,
        provider: opts.provider as RemoteConfig["provider"],
        ...(Object.keys(headers).length ? { headers } : {}),
      };
      addRemote(process.cwd(), name, config);
      console.log(`Remote "${name}" added (${opts.provider}: ${url})`);
    });

  remote
    .command("remove <name>")
    .description("Remove a named remote")
    .action((name: string) => {
      removeRemote(process.cwd(), name);
      console.log(`Remote "${name}" removed.`);
    });

  remote
    .command("list")
    .description("List all configured remotes")
    .action(() => {
      const remotes = listRemotes(process.cwd());
      if (remotes.length === 0) {
        console.log("No remotes configured.");
        return;
      }
      for (const r of remotes) {
        const synced = r.lastSynced ? `  last synced: ${r.lastSynced}` : "  never synced";
        console.log(`${r.name}  [${r.provider}]  ${r.url}${synced}`);
      }
    });

  remote
    .command("show <name>")
    .description("Show details for a specific remote")
    .action((name: string) => {
      const cfg = getRemote(process.cwd(), name);
      if (!cfg) {
        console.error(`Remote "${name}" not found.`);
        process.exit(1);
      }
      console.log(JSON.stringify({ name, ...cfg }, null, 2));
    });

  remote
    .command("touch <name>")
    .description("Update the lastSynced timestamp for a remote")
    .action((name: string) => {
      updateLastSynced(process.cwd(), name);
      console.log(`Remote "${name}" lastSynced updated.`);
    });
}
