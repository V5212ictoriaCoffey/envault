import { Command } from "commander";
import * as path from "path";
import { importEnvToVault } from "../../vault/vaultImport";
import { appendAuditEntry } from "../../vault/vaultAudit";

export function registerImportCommand(program: Command): void {
  program
    .command("import <envFile>")
    .description("Import variables from a .env file into the vault")
    .option("-v, --vault <path>", "Path to vault file", "vault.json")
    .option("-k, --public-key <path>", "Path to public key", "public.pem")
    .option("--overwrite", "Overwrite existing keys", false)
    .action(async (envFile: string, opts: { vault: string; publicKey: string; overwrite: boolean }) => {
      const vaultPath = path.resolve(opts.vault);
      const publicKeyPath = path.resolve(opts.publicKey);
      const envFilePath = path.resolve(envFile);

      try {
        const { imported, skipped } = await importEnvToVault(
          envFilePath,
          vaultPath,
          publicKeyPath,
          { overwrite: opts.overwrite }
        );

        if (imported.length > 0) {
          console.log(`✔ Imported ${imported.length} key(s): ${imported.join(", ")}`);
          for (const key of imported) {
            appendAuditEntry(vaultPath, { action: "import", key, timestamp: new Date().toISOString() });
          }
        }

        if (skipped.length > 0) {
          console.log(`⚠ Skipped ${skipped.length} existing key(s): ${skipped.join(", ")}`);
          console.log("  Use --overwrite to replace existing keys.");
        }

        if (imported.length === 0 && skipped.length === 0) {
          console.log("No keys found in the provided .env file.");
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
