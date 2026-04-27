import { Command } from 'commander';
import { getStorage } from '../../storage/index';

export function registerTagCommand(program: Command): void {
  program
    .command('tag <port> <tags...>')
    .description('Add one or more tags to a port entry')
    .option('--remove', 'Remove the specified tags instead of adding them')
    .option('--list', 'List all tags for the given port')
    .action(async (portArg: string, tags: string[], options: { remove?: boolean; list?: boolean }) => {
      const port = parseInt(portArg, 10);
      if (isNaN(port)) {
        console.error(`Invalid port: ${portArg}`);
        process.exit(1);
      }

      const storage = getStorage();
      const entry = storage.getPort(port);

      if (!entry) {
        console.error(`No entry found for port ${port}. Run 'scan' first.`);
        process.exit(1);
      }

      if (options.list) {
        const currentTags = entry.tags ?? [];
        if (currentTags.length === 0) {
          console.log(`Port ${port} has no tags.`);
        } else {
          console.log(`Tags for port ${port}: ${currentTags.join(', ')}`);
        }
        return;
      }

      const currentTags: string[] = entry.tags ?? [];

      let updatedTags: string[];
      if (options.remove) {
        updatedTags = currentTags.filter((t) => !tags.includes(t));
        console.log(`Removed tags [${tags.join(', ')}] from port ${port}.`);
      } else {
        const newTags = tags.filter((t) => !currentTags.includes(t));
        updatedTags = [...currentTags, ...newTags];
        console.log(`Added tags [${newTags.join(', ')}] to port ${port}.`);
      }

      storage.updatePort(port, { tags: updatedTags });
    });
}
