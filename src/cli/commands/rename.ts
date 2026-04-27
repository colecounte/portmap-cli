import { Command } from 'commander';
import { getStorage } from '../../storage/index';

export function registerRenameCommand(program: Command): void {
  program
    .command('rename <port> <newLabel>')
    .description('Rename the label for a tracked port')
    .option('--json', 'Output result as JSON')
    .action(async (portArg: string, newLabel: string, options: { json?: boolean }) => {
      const port = parseInt(portArg, 10);

      if (isNaN(port) || port < 1 || port > 65535) {
        console.error(`Error: "${portArg}" is not a valid port number.`);
        process.exit(1);
      }

      if (!newLabel || newLabel.trim().length === 0) {
        console.error('Error: newLabel must be a non-empty string.');
        process.exit(1);
      }

      const storage = await getStorage();
      const entry = storage.get(port);

      if (!entry) {
        console.error(`Error: Port ${port} is not currently tracked.`);
        process.exit(1);
      }

      const oldLabel = entry.label ?? '(none)';
      entry.label = newLabel.trim();
      entry.updatedAt = new Date().toISOString();
      storage.set(port, entry);
      await storage.save();

      if (options.json) {
        console.log(JSON.stringify({ port, oldLabel, newLabel: entry.label, updatedAt: entry.updatedAt }));
      } else {
        console.log(`Port ${port}: label renamed from "${oldLabel}" to "${entry.label}".`);
      }
    });
}
