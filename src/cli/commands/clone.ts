import { Command } from 'commander';
import { getStorage } from '../../storage/index';
import { PortMap } from '../../storage/portmap';

/**
 * Clones all port entries from a source label prefix to a new label prefix.
 * Useful for duplicating a service's port assignments under a new name.
 */
export function clonePortmap(
  sourcePrefix: string,
  targetPrefix: string,
  portmap: PortMap
): { cloned: number; skipped: number; result: PortMap } {
  const entries = Object.entries(portmap);
  let cloned = 0;
  let skipped = 0;
  const result: PortMap = { ...portmap };

  for (const [port, entry] of entries) {
    if (!entry.label || !entry.label.startsWith(sourcePrefix)) continue;

    const newLabel = entry.label.replace(sourcePrefix, targetPrefix);
    const alreadyExists = Object.values(portmap).some(
      (e) => e.label === newLabel
    );

    if (alreadyExists) {
      skipped++;
      continue;
    }

    // Find a free port number by offsetting — or just record with a note
    const newPort = String(Number(port) + 10000);
    if (result[newPort]) {
      skipped++;
      continue;
    }

    result[newPort] = {
      ...entry,
      label: newLabel,
      note: `Cloned from port ${port} (${entry.label})`,
      addedAt: new Date().toISOString(),
    };
    cloned++;
  }

  return { cloned, skipped, result };
}

export function registerCloneCommand(program: Command): void {
  program
    .command('clone <sourcePrefix> <targetPrefix>')
    .description(
      'Clone all port entries matching a label prefix to a new label prefix (ports offset by +10000)'
    )
    .option('--dry-run', 'Preview changes without saving')
    .action(async (sourcePrefix: string, targetPrefix: string, opts) => {
      const storage = getStorage();
      const portmap = await storage.load();

      const { cloned, skipped, result } = clonePortmap(
        sourcePrefix,
        targetPrefix,
        portmap
      );

      if (cloned === 0) {
        console.log(
          `No entries found matching label prefix "${sourcePrefix}".`
        );
        return;
      }

      if (opts.dryRun) {
        console.log(`[dry-run] Would clone ${cloned} entry/entries, skip ${skipped}.`);
        return;
      }

      await storage.save(result);
      console.log(
        `Cloned ${cloned} entry/entries from "${sourcePrefix}" → "${targetPrefix}". Skipped ${skipped}.`
      );
    });
}
