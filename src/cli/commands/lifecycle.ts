import { Command } from 'commander';
import {
  setLifecycleStage,
  removeLifecycleEntry,
  getLifecycleEntry,
  listKeysByStage,
  loadLifecycleStore,
  formatLifecycleSummary,
  LifecycleStage,
} from '../../vault/vaultLifecycle';

const VALID_STAGES: LifecycleStage[] = ['draft', 'active', 'deprecated', 'archived', 'deleted'];

export function registerLifecycleCommand(program: Command): void {
  const lifecycle = program
    .command('lifecycle')
    .description('Manage lifecycle stages for vault keys');

  lifecycle
    .command('set <key> <stage>')
    .description(`Set lifecycle stage for a key (${VALID_STAGES.join(', ')})`)
    .option('-r, --reason <reason>', 'Reason for the stage change')
    .option('-d, --dir <dir>', 'Vault directory', process.cwd())
    .action((key: string, stage: string, opts) => {
      if (!VALID_STAGES.includes(stage as LifecycleStage)) {
        console.error(`Invalid stage "${stage}". Valid stages: ${VALID_STAGES.join(', ')}`);
        process.exit(1);
      }
      setLifecycleStage(opts.dir, key, stage as LifecycleStage, opts.reason);
      console.log(`Lifecycle stage for "${key}" set to "${stage}".`);
    });

  lifecycle
    .command('get <key>')
    .description('Get lifecycle stage for a key')
    .option('-d, --dir <dir>', 'Vault directory', process.cwd())
    .action((key: string, opts) => {
      const entry = getLifecycleEntry(opts.dir, key);
      if (!entry) {
        console.log(`No lifecycle stage set for "${key}".`);
      } else {
        const reason = entry.reason ? ` (${entry.reason})` : '';
        console.log(`${key}: ${entry.stage}${reason} [${entry.updatedAt}]`);
      }
    });

  lifecycle
    .command('remove <key>')
    .description('Remove lifecycle entry for a key')
    .option('-d, --dir <dir>', 'Vault directory', process.cwd())
    .action((key: string, opts) => {
      removeLifecycleEntry(opts.dir, key);
      console.log(`Lifecycle entry for "${key}" removed.`);
    });

  lifecycle
    .command('list')
    .description('List all lifecycle stages')
    .option('-s, --stage <stage>', 'Filter by stage')
    .option('-d, --dir <dir>', 'Vault directory', process.cwd())
    .action((opts) => {
      if (opts.stage) {
        if (!VALID_STAGES.includes(opts.stage as LifecycleStage)) {
          console.error(`Invalid stage "${opts.stage}".`);
          process.exit(1);
        }
        const keys = listKeysByStage(opts.dir, opts.stage as LifecycleStage);
        if (keys.length === 0) {
          console.log(`No keys with stage "${opts.stage}".`);
        } else {
          console.log(keys.join('\n'));
        }
      } else {
        const store = loadLifecycleStore(opts.dir);
        console.log(formatLifecycleSummary(store));
      }
    });
}
