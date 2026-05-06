import { Command } from "commander";
import * as path from "path";
import * as fs from "fs";
import {
  buildTemplateFromEnvFile,
  generateEnvScaffold,
  loadTemplate,
  saveTemplate,
  VaultTemplate,
} from "../../vault/vaultTemplate";

export function registerTemplateCommand(program: Command): void {
  const template = program
    .command("template")
    .description("Manage vault key templates");

  template
    .command("init <name>")
    .description("Create a template from an existing .env file")
    .option("--env <path>", "Path to .env file", ".env")
    .option("--vault-dir <dir>", "Vault directory", ".")
    .option("--description <desc>", "Template description")
    .action((name: string, opts: { env: string; vaultDir: string; description?: string }) => {
      const envPath = path.resolve(opts.env);
      if (!fs.existsSync(envPath)) {
        console.error(`Error: .env file not found at ${envPath}`);
        process.exit(1);
      }
      const tmpl = buildTemplateFromEnvFile(envPath, name);
      if (opts.description) tmpl.description = opts.description;
      saveTemplate(path.resolve(opts.vaultDir), tmpl);
      console.log(`Template "${name}" saved with ${tmpl.keys.length} key(s).`);
    });

  template
    .command("show")
    .description("Show the current template")
    .option("--vault-dir <dir>", "Vault directory", ".")
    .action((opts: { vaultDir: string }) => {
      const tmpl = loadTemplate(path.resolve(opts.vaultDir));
      if (!tmpl) {
        console.log("No template found. Run `template init` to create one.");
        return;
      }
      console.log(`Template: ${tmpl.name}`);
      if (tmpl.description) console.log(`Description: ${tmpl.description}`);
      console.log(`Keys (${tmpl.keys.length}):`);
      for (const k of tmpl.keys) {
        const req = k.required ? "[required]" : "[optional]";
        const desc = k.description ? ` — ${k.description}` : "";
        console.log(`  ${k.key} ${req}${desc}`);
      }
    });

  template
    .command("scaffold")
    .description("Generate a .env scaffold from the template")
    .option("--vault-dir <dir>", "Vault directory", ".")
    .option("--output <path>", "Output file path", ".env.example")
    .action((opts: { vaultDir: string; output: string }) => {
      const tmpl = loadTemplate(path.resolve(opts.vaultDir));
      if (!tmpl) {
        console.error("No template found. Run `template init` first.");
        process.exit(1);
      }
      const scaffold = generateEnvScaffold(tmpl);
      fs.writeFileSync(path.resolve(opts.output), scaffold, "utf-8");
      console.log(`Scaffold written to ${opts.output}`);
    });
}
