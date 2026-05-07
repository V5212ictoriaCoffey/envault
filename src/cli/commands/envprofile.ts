import { Command } from "commander";
import {
  createEnvProfile,
  deleteEnvProfile,
  getEnvProfile,
  listEnvProfiles,
  updateEnvProfileKeys,
} from "../../vault/vaultEnvProfile";

export function registerEnvProfileCommand(program: Command): void {
  const envprofile = program
    .command("envprofile")
    .description("Manage named env profiles (groups of keys)");

  envprofile
    .command("create <name> [keys...]")
    .description("Create a new env profile with the given keys")
    .option("-d, --description <desc>", "Profile description")
    .option("--vault-dir <dir>", "Vault directory", ".")
    .action((name: string, keys: string[], opts: { description?: string; vaultDir: string }) => {
      if (keys.length === 0) {
        console.error("Error: at least one key is required.");
        process.exit(1);
      }
      const profile = createEnvProfile(opts.vaultDir, name, keys, opts.description);
      console.log(`Profile "${profile.name}" created with keys: ${profile.keys.join(", ")}`);
    });

  envprofile
    .command("list")
    .description("List all env profiles")
    .option("--vault-dir <dir>", "Vault directory", ".")
    .action((opts: { vaultDir: string }) => {
      const profiles = listEnvProfiles(opts.vaultDir);
      if (profiles.length === 0) {
        console.log("No profiles defined.");
        return;
      }
      for (const p of profiles) {
        const desc = p.description ? ` — ${p.description}` : "";
        console.log(`  ${p.name}${desc}`);
        console.log(`    Keys: ${p.keys.join(", ")}`);
        console.log(`    Updated: ${p.updatedAt}`);
      }
    });

  envprofile
    .command("show <name>")
    .description("Show details of a specific profile")
    .option("--vault-dir <dir>", "Vault directory", ".")
    .action((name: string, opts: { vaultDir: string }) => {
      const profile = getEnvProfile(opts.vaultDir, name);
      if (!profile) {
        console.error(`Profile "${name}" not found.`);
        process.exit(1);
      }
      console.log(JSON.stringify(profile, null, 2));
    });

  envprofile
    .command("update <name> [keys...]")
    .description("Update the keys of an existing profile")
    .option("--vault-dir <dir>", "Vault directory", ".")
    .action((name: string, keys: string[], opts: { vaultDir: string }) => {
      const updated = updateEnvProfileKeys(opts.vaultDir, name, keys);
      if (!updated) {
        console.error(`Profile "${name}" not found.`);
        process.exit(1);
      }
      console.log(`Profile "${name}" updated with keys: ${updated.keys.join(", ")}`);
    });

  envprofile
    .command("delete <name>")
    .description("Delete a profile")
    .option("--vault-dir <dir>", "Vault directory", ".")
    .action((name: string, opts: { vaultDir: string }) => {
      const deleted = deleteEnvProfile(opts.vaultDir, name);
      if (!deleted) {
        console.error(`Profile "${name}" not found.`);
        process.exit(1);
      }
      console.log(`Profile "${name}" deleted.`);
    });
}
