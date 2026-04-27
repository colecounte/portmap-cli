import { Command } from 'commander';
import { getStorage } from '../../storage/index';

export function registerClearCommand(program: Command): void {
  program
    .command('clear')
    .description('Remove port entries from the portmap')
    .option('-p, --port <number>', 'Remove a specific port entry')
    .option('--all', 'Remove all port entries', false)
    .option('--inactive', 'Remove only ports that are currently inactive', false)
    .action(async (options) => {
      const storage = getStorage();
      const portmap = storage.load();

      if (options.all) {
        const count = Object.keys(portmap).length;
        storage.save({});
        console.log(`Cleared all ${count} port entries.`);
        return;
      }

      if (options.inactive) {
        const { checkPort } = await import('../../scanner/portScanner');
        let removed = 0;
        const updated = { ...portmap };

        for (const port of Object.keys(updated)) {
          const isOpen = await checkPort(Number(port));
          if (!isOpen) {
            delete updated[port];
            removed++;
          }
        }

        storage.save(updated);
        console.log(`Removed ${removed} inactive port entries.`);
        return;
      }

      if (options.port) {
        const port = String(options.port);
        if (!portmap[port]) {
          console.error(`Port ${port} not found in portmap.`);
          process.exit(1);
        }
        const updated = { ...portmap };
        delete updated[port];
        storage.save(updated);
        console.log(`Removed port ${port} from portmap.`);
        return;
      }

      console.error('Please specify --port <number>, --inactive, or --all.');
      process.exit(1);
    });
}
