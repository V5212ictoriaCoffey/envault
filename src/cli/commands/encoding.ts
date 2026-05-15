import { Command } from 'commander';
import path from 'path';
import {
  setEncoding,
  removeEncoding,
  getEncoding,
  listEncodings,
  EncodingType,
} from '../../vault/vaultEncoding';

const VALID_ENCODINGS: EncodingType[] = ['utf8', 'base64', 'hex', 'latin1'];

export function registerEncodingCommand(program: Command): void {
  const encoding = program
    .command('encoding')
    .description('Manage encoding metadata for vault keys');

  encoding
    .command('set <key> <encoding>')
    .description(`Set encoding for a key (${VALID_ENCODINGS.join(', ')})`)
    .option('-d, --dir <dir>', 'Vault directory', process.cwd())
    .action(async (key: string, enc: string, opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      if (!VALID_ENCODINGS.includes(enc as EncodingType)) {
        console.error(`Invalid encoding "${enc}". Valid options: ${VALID_ENCODINGS.join(', ')}`);
        process.exit(1);
      }
      await setEncoding(vaultDir, key, enc as EncodingType);
      console.log(`Encoding for "${key}" set to "${enc}".`);
    });

  encoding
    .command('get <key>')
    .description('Get encoding for a key')
    .option('-d, --dir <dir>', 'Vault directory', process.cwd())
    .action(async (key: string, opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      const enc = await getEncoding(vaultDir, key);
      if (enc) {
        console.log(`${key}: ${enc}`);
      } else {
        console.log(`No encoding set for "${key}".`);
      }
    });

  encoding
    .command('remove <key>')
    .description('Remove encoding metadata for a key')
    .option('-d, --dir <dir>', 'Vault directory', process.cwd())
    .action(async (key: string, opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      await removeEncoding(vaultDir, key);
      console.log(`Encoding metadata removed for "${key}".`);
    });

  encoding
    .command('list')
    .description('List all key encodings')
    .option('-d, --dir <dir>', 'Vault directory', process.cwd())
    .action(async (opts: { dir: string }) => {
      const vaultDir = path.resolve(opts.dir);
      const store = await listEncodings(vaultDir);
      const entries = Object.entries(store);
      if (entries.length === 0) {
        console.log('No encoding metadata found.');
        return;
      }
      entries.forEach(([key, enc]) => {
        console.log(`  ${key}: ${enc}`);
      });
    });
}
