import { Vault } from "./vault";

export type DiffStatus = "added" | "removed" | "changed" | "unchanged";

export interface DiffEntry {
  key: string;
  status: DiffStatus;
  oldValue?: string;
  newValue?: string;
}

export interface VaultDiffResult {
  entries: DiffEntry[];
  added: number;
  removed: number;
  changed: number;
  unchanged: number;
}

export function diffVaults(base: Vault, target: Vault): VaultDiffResult {
  const entries: DiffEntry[] = [];
  const baseKeys = new Set(Object.keys(base.secrets));
  const targetKeys = new Set(Object.keys(target.secrets));
  const allKeys = new Set([...baseKeys, ...targetKeys]);

  let added = 0, removed = 0, changed = 0, unchanged = 0;

  for (const key of Array.from(allKeys).sort()) {
    const inBase = baseKeys.has(key);
    const inTarget = targetKeys.has(key);

    if (!inBase && inTarget) {
      entries.push({ key, status: "added", newValue: target.secrets[key] });
      added++;
    } else if (inBase && !inTarget) {
      entries.push({ key, status: "removed", oldValue: base.secrets[key] });
      removed++;
    } else if (base.secrets[key] !== target.secrets[key]) {
      entries.push({
        key,
        status: "changed",
        oldValue: base.secrets[key],
        newValue: target.secrets[key],
      });
      changed++;
    } else {
      entries.push({ key, status: "unchanged", oldValue: base.secrets[key] });
      unchanged++;
    }
  }

  return { entries, added, removed, changed, unchanged };
}

export function formatDiff(result: VaultDiffResult, showUnchanged = false): string {
  const lines: string[] = [];

  for (const entry of result.entries) {
    if (entry.status === "unchanged" && !showUnchanged) continue;
    const prefix =
      entry.status === "added" ? "+" :
      entry.status === "removed" ? "-" :
      entry.status === "changed" ? "~" : " ";
    lines.push(`${prefix} ${entry.key}`);
  }

  lines.push("");
  lines.push(
    `Summary: +${result.added} added, -${result.removed} removed, ~${result.changed} changed, ${result.unchanged} unchanged`
  );

  return lines.join("\n");
}
