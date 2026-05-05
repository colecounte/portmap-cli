import { Command } from 'commander';
import { getStorage } from '../../storage/index';

export interface ExpiryOptions {
  days?: string;
  hours?: string;
  remove?: boolean;
}

export function getExpiredPorts(
  storage: Record<string, { label?: string; lastSeen?: string; pinned?: boolean }>,
  thresholdMs: number
): string[] {
  const now = Date.now();
  return Object.entries(storage)
    .filter(([, entry]) => {
      if (entry.pinned) return false;
      if (!entry.lastSeen) return false;
      const age = now - new Date(entry.lastSeen).getTime();
      return age > thresholdMs;
    })
    .map(([port]) => port);
}

export function registerExpireCommand(program: Command): void {
  program
    .command('expire')
    .description('List or remove port entries that have not been seen recently')
    .option('-d, --days <number>', 'Expiry threshold in days', '7')
    .option('-H, --hours <number>', 'Expiry threshold in hours (overrides --days)')
    .option('-r, --remove', 'Remove expired entries from storage', false)
    .action(async (opts: ExpiryOptions) => {
      const storage = await getStorage();
      const data = storage.getAll();

      const thresholdMs = opts.hours
        ? parseFloat(opts.hours) * 60 * 60 * 1000
        : parseFloat(opts.days ?? '7') * 24 * 60 * 60 * 1000;

      const expired = getExpiredPorts(data, thresholdMs);

      if (expired.length === 0) {
        console.log('No expired port entries found.');
        return;
      }

      if (opts.remove) {
        for (const port of expired) {
          storage.remove(port);
        }
        await storage.save();
        console.log(`Removed ${expired.length} expired port(s): ${expired.join(', ')}`);
      } else {
        console.log(`Expired ports (${expired.length}):`);
        for (const port of expired) {
          const entry = data[port];
          const label = entry.label ? ` — ${entry.label}` : '';
          const lastSeen = entry.lastSeen
            ? ` (last seen: ${new Date(entry.lastSeen).toLocaleDateString()})`
            : '';
          console.log(`  ${port}${label}${lastSeen}`);
        }
        console.log('\nRun with --remove to delete these entries.');
      }
    });
}
