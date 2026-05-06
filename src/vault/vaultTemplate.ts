import * as fs from "fs";
import * as path from "path";
import { parseEnv, stringifyEnv } from "../env/parser";

export interface VaultTemplate {
  name: string;
  description?: string;
  keys: TemplateKey[];
  createdAt: string;
}

export interface TemplateKey {
  key: string;
  description?: string;
  required: boolean;
  defaultValue?: string;
  example?: string;
}

export function getTemplatePath(vaultDir: string): string {
  return path.join(vaultDir, ".vault-template.json");
}

export function loadTemplate(vaultDir: string): VaultTemplate | null {
  const templatePath = getTemplatePath(vaultDir);
  if (!fs.existsSync(templatePath)) return null;
  const raw = fs.readFileSync(templatePath, "utf-8");
  return JSON.parse(raw) as VaultTemplate;
}

export function saveTemplate(vaultDir: string, template: VaultTemplate): void {
  const templatePath = getTemplatePath(vaultDir);
  fs.writeFileSync(templatePath, JSON.stringify(template, null, 2), "utf-8");
}

export function buildTemplateFromEnvFile(envFilePath: string, name: string): VaultTemplate {
  const raw = fs.readFileSync(envFilePath, "utf-8");
  const parsed = parseEnv(raw);
  const keys: TemplateKey[] = Object.keys(parsed).map((key) => ({
    key,
    required: true,
    example: parsed[key] ? `<${key.toLowerCase()}>` : undefined,
  }));
  return {
    name,
    keys,
    createdAt: new Date().toISOString(),
  };
}

export function generateEnvScaffold(template: VaultTemplate): string {
  const record: Record<string, string> = {};
  for (const entry of template.keys) {
    record[entry.key] = entry.defaultValue ?? "";
  }
  const lines: string[] = [];
  if (template.description) {
    lines.push(`# ${template.description}`);
    lines.push("");
  }
  for (const entry of template.keys) {
    if (entry.description) lines.push(`# ${entry.description}`);
    if (entry.example) lines.push(`# Example: ${entry.example}`);
    if (entry.required) lines.push(`# Required`);
    lines.push(`${entry.key}=${entry.defaultValue ?? ""}`);
    lines.push("");
  }
  return lines.join("\n");
}
