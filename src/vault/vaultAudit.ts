import * as fs from "fs";
import * as path from "path";

export interface AuditEntry {
  timestamp: string;
  action: "add" | "remove" | "rotate" | "export" | "sync" | "access_grant" | "access_revoke";
  key?: string;
  actor?: string;
  details?: string;
}

export interface AuditLog {
  entries: AuditEntry[];
}

const AUDIT_FILE = ".envault-audit.json";

export function getAuditPath(dir: string = process.cwd()): string {
  return path.join(dir, AUDIT_FILE);
}

export function loadAuditLog(dir: string = process.cwd()): AuditLog {
  const auditPath = getAuditPath(dir);
  if (!fs.existsSync(auditPath)) {
    return { entries: [] };
  }
  const raw = fs.readFileSync(auditPath, "utf-8");
  return JSON.parse(raw) as AuditLog;
}

export function saveAuditLog(log: AuditLog, dir: string = process.cwd()): void {
  const auditPath = getAuditPath(dir);
  fs.writeFileSync(auditPath, JSON.stringify(log, null, 2), "utf-8");
}

export function appendAuditEntry(
  entry: Omit<AuditEntry, "timestamp">,
  dir: string = process.cwd()
): void {
  const log = loadAuditLog(dir);
  const fullEntry: AuditEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
  };
  log.entries.push(fullEntry);
  saveAuditLog(log, dir);
}

export function formatAuditLog(log: AuditLog): string {
  if (log.entries.length === 0) {
    return "No audit entries found.";
  }
  return log.entries
    .map((e) => {
      const parts = [`[${e.timestamp}]`, e.action.toUpperCase()];
      if (e.key) parts.push(`key=${e.key}`);
      if (e.actor) parts.push(`actor=${e.actor}`);
      if (e.details) parts.push(e.details);
      return parts.join(" ");
    })
    .join("\n");
}
