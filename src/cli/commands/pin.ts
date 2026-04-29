import { Command } from 'commander';
import { getStorage } from '../../storage/index';

export function registerPinCommand(program: Command): void {
  program
    .command('pin <port>')
    .description('Pin or unpin a port entry to prevent it from being cleared')
    .option('--unpin', 'Remove the pin from the port')
    .action(async (portArg: string, options: { unpin?: boolean }) => {
      const port = parseInt(portArg, 10);

      if (isNaN(port) || port < 1 || port > 65535) {
        console.error(`Invalid port number: ${portArg}`);
        process.exit(1);
      }

      const storage = getStorage();
      const map = storage.load();

      const entry = map[port];
      if (!entry) {
        console.error(`No entry found for port ${port}. Run 'scan' first or add a label.`);
        process.exit(1);
      }

      if (options.unpin) {
        if (!entry.pinned) {
          console.log(`Port ${port} is not pinned.`);
          return;
        }
        entry.pinned = false;
        map[port] = entry;
        storage.save(map);
        console.log(`Port ${port} unpinned.`);
      } else {
        if (entry.pinned) {
          console.log(`Port ${port} is already pinned.`);
          return;
        }
        entry.pinned = true;
        map[port] = entry;
        storage.save(map);
        console.log(`Port ${port} pinned. It will be preserved during 'clear' operations.`);
      }
    });
}
