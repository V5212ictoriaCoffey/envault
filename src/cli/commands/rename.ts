import { Command } from 'commander';
import * as path from 'path';
import { loadVault, saveVault } from '../../vault/vault';
import { recordRename, listRenames, renameKeyInVault } from '../../vault/vaultRename';
import { appendAuditEntry } from '../../vault/vaultAudit';

export function registerRenameCommand(program: Command): void {
  const rename = program
    .command('rename')
    .description('Rename a key within the vault');

  rename
    .command('key <oldKey> <newKey>')
    .description('Rename a vault key from <oldKey> to <newKey>')
    .option('-d, --dir <dir>', 'Vault directory', process.cwd())
    .action(async (oldKey: string, newKey: string, opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      try {
        const vault = await loadVault(vaultDir);
        const updated = renameKeyInVault(vault.data, oldKey, newKey);
        vault.data = updated;
        await saveVault(vaultDir, vault);
        recordRename(vaultDir, oldKey, newKey);
        appendAuditEntry(vaultDir, {
          action: 'rename',
          key: oldKey,
          detail: `renamed to ${newKey}`,
          timestamp: new Date().toISOString(),
        });
        console.log(`✔ Renamed "${oldKey}" → "${newKey}"`);
      } catch (err: any) {
        console.error(`✖ ${err.message}`);
        process.exit(1);
      }
    });

  rename
    .command('list')
    .description('List all recorded key renames')
    .option('-d, --dir <dir>', 'Vault directory', process.cwd())
    .action((opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      const renames = listRenames(vaultDir);
      if (renames.length === 0) {
        console.log('No renames recorded.');
        return;
      }
      console.log('Recorded renames:');
      for (const { from, to } of renames) {
        console.log(`  ${from} → ${to}`);
      }
    });
}
