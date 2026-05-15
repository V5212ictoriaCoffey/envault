import { Command } from 'commander';
import * as path from 'path';
import {
  linkKeys,
  unlinkKeys,
  getLinksForKey,
  getAllLinks,
} from '../../vault/vaultLinked';

export function registerLinkedCommand(program: Command): void {
  const linked = program
    .command('linked')
    .description('Manage linked keys within the vault');

  linked
    .command('add <sourceKey> <targetKey>')
    .description('Link two keys together')
    .option('-d, --description <desc>', 'Optional description for the link')
    .option('--vault-dir <dir>', 'Vault directory', process.cwd())
    .action((sourceKey: string, targetKey: string, opts) => {
      const vaultDir = path.resolve(opts.vaultDir);
      linkKeys(vaultDir, sourceKey, targetKey, opts.description);
      console.log(`Linked '${sourceKey}' → '${targetKey}'`);
    });

  linked
    .command('remove <sourceKey> <targetKey>')
    .description('Remove a link between two keys')
    .option('--vault-dir <dir>', 'Vault directory', process.cwd())
    .action((sourceKey: string, targetKey: string, opts) => {
      const vaultDir = path.resolve(opts.vaultDir);
      unlinkKeys(vaultDir, sourceKey, targetKey);
      console.log(`Unlinked '${sourceKey}' → '${targetKey}'`);
    });

  linked
    .command('list [key]')
    .description('List all links, or links for a specific key')
    .option('--vault-dir <dir>', 'Vault directory', process.cwd())
    .action((key: string | undefined, opts) => {
      const vaultDir = path.resolve(opts.vaultDir);
      const links = key ? getLinksForKey(vaultDir, key) : getAllLinks(vaultDir);
      if (links.length === 0) {
        console.log('No links found.');
        return;
      }
      for (const link of links) {
        const desc = link.description ? ` (${link.description})` : '';
        console.log(`  ${link.sourceKey} → ${link.targetKey}${desc}`);
      }
    });
}
