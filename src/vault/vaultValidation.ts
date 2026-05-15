import * as fs from 'fs/promises';
import * as path from 'path';
import { loadFormatStore, validateValueFormat, FormatType } from './vaultFormat';

export interface ValidationResult {
  key: string;
  value: string;
  format: FormatType;
  valid: boolean;
  message?: string;
}

export interface ValidationReport {
  passed: ValidationResult[];
  failed: ValidationResult[];
  skipped: string[];
}

export function getValidationPath(vaultDir: string): string {
  return path.join(vaultDir, '.envault', 'validation.json');
}

export interface ValidationRuleStore {
  [key: string]: { required?: boolean; minLength?: number; maxLength?: number; pattern?: string };
}

export async function loadValidationRules(vaultDir: string): Promise<ValidationRuleStore> {
  const filePath = getValidationPath(vaultDir);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function saveValidationRules(vaultDir: string, store: ValidationRuleStore): Promise<void> {
  const filePath = getValidationPath(vaultDir);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export async function validateVaultEntries(
  vaultDir: string,
  entries: Record<string, string>
): Promise<ValidationReport> {
  const formatStore = await loadFormatStore(vaultDir);
  const rules = await loadValidationRules(vaultDir);
  const report: ValidationReport = { passed: [], failed: [], skipped: [] };

  for (const [key, value] of Object.entries(entries)) {
    const format = formatStore[key];
    const rule = rules[key];

    if (!format && !rule) {
      report.skipped.push(key);
      continue;
    }

    const result: ValidationResult = { key, value, format: format ?? 'string', valid: true };

    if (format && !validateValueFormat(value, format)) {
      result.valid = false;
      result.message = `Value does not match expected format "${format}"}`;
    }

    if (rule?.minLength !== undefined && value.length < rule.minLength) {
      result.valid = false;
      result.message = `Value is shorter than minimum length ${rule.minLength}`;
    }

    if (rule?.maxLength !== undefined && value.length > rule.maxLength) {
      result.valid = false;
      result.message = `Value exceeds maximum length ${rule.maxLength}`;
    }

    if (rule?.pattern) {
      const regex = new RegExp(rule.pattern);
      if (!regex.test(value)) {
        result.valid = false;
        result.message = `Value does not match pattern /${rule.pattern}/`;
      }
    }

    if (result.valid) {
      report.passed.push(result);
    } else {
      report.failed.push(result);
    }
  }

  return report;
}

export function formatValidationReport(report: ValidationReport): string {
  const lines: string[] = [];
  if (report.passed.length > 0) {
    lines.push(`✅ Passed (${report.passed.length}): ${report.passed.map(r => r.key).join(', ')}`);
  }
  if (report.failed.length > 0) {
    lines.push(`❌ Failed (${report.failed.length}):`);
    for (const r of report.failed) {
      lines.push(`  - ${r.key}: ${r.message}`);
    }
  }
  if (report.skipped.length > 0) {
    lines.push(`⚠️  Skipped (${report.skipped.length}): ${report.skipped.join(', ')}`);
  }
  return lines.join('\n');
}
