import { Command } from 'commander';
import { getStorage } from '../../storage/index';
import { PortMap } from '../../storage/portmap';

export interface MergeResult {
  added: number;
  skipped: number;
  overwritten: number;
}

export function mergePortmaps(
  base: PortMap,
  incoming: PortMap,
  strategy: 'skip' | 'overwrite' = 'skip'
): { merged: PortMap; result: MergeResult } {
  const merged: PortMap = { ...base };
  const result: MergeResult = { added: 0, skipped: 0, overwritten: 0 };

  for (const [portStr, entry] of Object.entries(incoming)) {
    if (merged[portStr] === undefined) {
      merged[portStr] = entry;
      result.added++;
    } else if (strategy === 'overwrite') {
      merged[portStr] = entry;
      result.overwritten++;
    } else {
      result.skipped++;
    }
  }

  return { merged, result };
}

export function registerMergeCommand(program: Command): void {
  program
    .command('merge <file>')
    .description('Merge port entries from an external portmap JSON file into the current portmap')
    .option('--overwrite', 'Overwrite existing entries with incoming values', false)
    .option('--dry-run', 'Preview changes without applying them', false)
    .action(async (file: string, options: { overwrite: boolean; dryRun: boolean }) => {
      const fs = await import('fs/promises');
      const path = await import('path');

      const resolvedPath = path.resolve(file);
      let incoming: PortMap;

      try {
        const raw = await fs.readFile(resolvedPath, 'utf-8');
        incoming = JSON.parse(raw);
      } catch {
        console.error(`Error: Could not read or parse file "${resolvedPath}"`);
        process.exit(1);
      }

      const storage = getStorage();
      const base = storage.load();
      const strategy = options.overwrite ? 'overwrite' : 'skip';
      const { merged, result } = mergePortmaps(base, incoming, strategy);

      if (options.dryRun) {
        console.log('[Dry Run] Merge preview:');
        console.log(`  Would add: ${result.added}`);
        console.log(`  Would overwrite: ${result.overwritten}`);
        console.log(`  Would skip: ${result.skipped}`);
        return;
      }

      storage.save(merged);
      console.log(`Merge complete:`);
      console.log(`  Added: ${result.added}`);
      console.log(`  Overwritten: ${result.overwritten}`);
      console.log(`  Skipped: ${result.skipped}`);
    });
}
