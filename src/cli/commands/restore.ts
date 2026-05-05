import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { getStorage } from '../../storage/index';
import { PortMap } from '../../storage/portmap';

export interface RestoreResult {
  restored: number;
  skipped: number;
  overwritten: number;
}

export function restoreSnapshot(
  snapshotData: Record<string, PortMap>,
  overwrite: boolean
): RestoreResult {
  const storage = getStorage();
  const current = storage.load();
  const result: RestoreResult = { restored: 0, skipped: 0, overwritten: 0 };

  for (const [portStr, entry] of Object.entries(snapshotData)) {
    const port = Number(portStr);
    if (current[port] && !overwrite) {
      result.skipped++;
    } else if (current[port] && overwrite) {
      storage.set(port, entry);
      result.overwritten++;
    } else {
      storage.set(port, entry);
      result.restored++;
    }
  }

  return result;
}

export function registerRestoreCommand(program: Command): void {
  program
    .command('restore <file>')
    .description('Restore port mappings from a snapshot file')
    .option('--overwrite', 'Overwrite existing port entries', false)
    .option('--dry-run', 'Preview changes without applying them', false)
    .action((file: string, options: { overwrite: boolean; dryRun: boolean }) => {
      const resolved = path.resolve(file);

      if (!fs.existsSync(resolved)) {
        console.error(`Error: Snapshot file not found: ${resolved}`);
        process.exit(1);
      }

      let snapshotData: Record<string, PortMap>;
      try {
        const raw = fs.readFileSync(resolved, 'utf-8');
        snapshotData = JSON.parse(raw);
      } catch {
        console.error('Error: Failed to parse snapshot file. Ensure it is valid JSON.');
        process.exit(1);
      }

      if (options.dryRun) {
        const storage = getStorage();
        const current = storage.load();
        let wouldRestore = 0;
        let wouldSkip = 0;
        let wouldOverwrite = 0;
        for (const portStr of Object.keys(snapshotData)) {
          const port = Number(portStr);
          if (current[port] && !options.overwrite) wouldSkip++;
          else if (current[port] && options.overwrite) wouldOverwrite++;
          else wouldRestore++;
        }
        console.log(`Dry run — no changes applied.`);
        console.log(`  Would restore:   ${wouldRestore}`);
        console.log(`  Would overwrite: ${wouldOverwrite}`);
        console.log(`  Would skip:      ${wouldSkip}`);
        return;
      }

      const result = restoreSnapshot(snapshotData, options.overwrite);
      console.log(`Restore complete.`);
      console.log(`  Restored:   ${result.restored}`);
      console.log(`  Overwritten: ${result.overwritten}`);
      console.log(`  Skipped:    ${result.skipped}`);
    });
}
