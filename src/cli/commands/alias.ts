import { Command } from 'commander';
import { getStorage } from '../../storage/index';

export function registerAliasCommand(program: Command): void {
  const alias = program
    .command('alias')
    .description('Manage short aliases for ports');

  alias
    .command('set <port> <alias>')
    .description('Assign a short alias to a port')
    .action((portStr: string, aliasName: string) => {
      const port = parseInt(portStr, 10);
      if (isNaN(port)) {
        console.error(`Invalid port: ${portStr}`);
        process.exit(1);
      }

      const storage = getStorage();
      const entry = storage.get(port);

      if (!entry) {
        console.error(`No entry found for port ${port}. Run scan first.`);
        process.exit(1);
      }

      const trimmed = aliasName.trim();
      if (!trimmed || /\s/.test(trimmed)) {
        console.error('Alias must be a single non-empty word with no spaces.');
        process.exit(1);
      }

      // Check alias uniqueness across all ports
      const existing = storage.findByAlias(trimmed);
      if (existing && existing.port !== port) {
        console.error(`Alias "${trimmed}" is already used by port ${existing.port}.`);
        process.exit(1);
      }

      storage.setAlias(port, trimmed);
      console.log(`Alias "${trimmed}" set for port ${port}.`);
    });

  alias
    .command('remove <port>')
    .description('Remove the alias from a port')
    .action((portStr: string) => {
      const port = parseInt(portStr, 10);
      if (isNaN(port)) {
        console.error(`Invalid port: ${portStr}`);
        process.exit(1);
      }

      const storage = getStorage();
      const entry = storage.get(port);

      if (!entry) {
        console.error(`No entry found for port ${port}.`);
        process.exit(1);
      }

      if (!entry.alias) {
        console.log(`Port ${port} has no alias to remove.`);
        return;
      }

      storage.setAlias(port, undefined);
      console.log(`Alias removed from port ${port}.`);
    });

  alias
    .command('list')
    .description('List all ports that have aliases')
    .action(() => {
      const storage = getStorage();
      const all = storage.getAll();
      const aliased = all.filter((e) => e.alias);

      if (aliased.length === 0) {
        console.log('No aliases defined.');
        return;
      }

      console.log('Port   Alias              Label');
      console.log('------ ------------------ --------------------');
      for (const entry of aliased) {
        const portCol = String(entry.port).padEnd(6);
        const aliasCol = (entry.alias ?? '').padEnd(18);
        const labelCol = entry.label ?? '(no label)';
        console.log(`${portCol} ${aliasCol} ${labelCol}`);
      }
    });
}
