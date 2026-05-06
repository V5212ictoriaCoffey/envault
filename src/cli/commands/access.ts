import { Command } from 'commander';
import * as fs from 'fs';
import {
  loadAccessList,
  saveAccessList,
  addAccessEntry,
  removeAccessEntry,
} from '../../vault/vaultAccess';

export function registerAccessCommand(program: Command): void {
  const access = program
    .command('access')
    .description('Manage team member access to the vault');

  access
    .command('grant <alias> <publicKeyPath>')
    .description('Grant access to a team member by alias and public key path')
    .action((alias: string, publicKeyPath: string) => {
      if (!fs.existsSync(publicKeyPath)) {
        console.error(`Error: Public key file not found: ${publicKeyPath}`);
        process.exit(1);
      }
      try {
        const list = loadAccessList();
        const updated = addAccessEntry(list, alias, publicKeyPath);
        saveAccessList(updated);
        console.log(`✔ Access granted to "${alias}" using key: ${publicKeyPath}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  access
    .command('revoke <alias>')
    .description('Revoke access for a team member by alias')
    .action((alias: string) => {
      try {
        const list = loadAccessList();
        const updated = removeAccessEntry(list, alias);
        saveAccessList(updated);
        console.log(`✔ Access revoked for "${alias}"`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  access
    .command('list')
    .description('List all team members with vault access')
    .action(() => {
      const list = loadAccessList();
      if (list.entries.length === 0) {
        console.log('No team members have been granted access yet.');
        return;
      }
      console.log('Team members with vault access:');
      for (const entry of list.entries) {
        console.log(`  • ${entry.alias}`);
        console.log(`    Key: ${entry.publicKeyPath}`);
        console.log(`    Added: ${entry.addedAt}`);
      }
    });
}
