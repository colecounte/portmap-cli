import { Command } from 'commander';
import { getStorage } from '../../storage/index';
import { appendHistory } from '../../storage/historyStore';

export function registerForgetCommand(program: Command): void {
  program
    .command('forget <port>')
    .description('Remove a port entry from the portmap permanently')
    .option('-f, --force', 'Skip confirmation prompt', false)
    .option('--keep-history', 'Retain history entries for this port', false)
    .action(async (portArg: string, options: { force: boolean; keepHistory: boolean }) => {
      const port = parseInt(portArg, 10);

      if (isNaN(port) || port < 1 || port > 65535) {
        console.error(`Invalid port: ${portArg}`);
        process.exit(1);
      }

      const storage = getStorage();
      const portmap = storage.read();

      if (!portmap[port]) {
        console.error(`Port ${port} is not registered in the portmap.`);
        process.exit(1);
      }

      const entry = portmap[port];

      if (!options.force) {
        const label = entry.label ?? '(no label)';
        console.log(`About to remove port ${port} (${label}).`);
        console.log('Use --force to confirm deletion.');
        process.exit(0);
      }

      if (!options.keepHistory) {
        // Record a tombstone history entry before deletion
        appendHistory(port, {
          event: 'forgotten',
          label: entry.label,
          timestamp: new Date().toISOString(),
        });
      }

      delete portmap[port];
      storage.write(portmap);

      console.log(`Port ${port} has been removed from the portmap.`);
    });
}
