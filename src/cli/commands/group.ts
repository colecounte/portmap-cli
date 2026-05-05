import { Command } from 'commander';
import { getStorage } from '../../storage/index';

export function registerGroupCommand(program: Command): void {
  const group = program
    .command('group')
    .description('Manage port groups for logical organization');

  group
    .command('add <groupName> <ports...>')
    .description('Add ports to a named group')
    .action(async (groupName: string, ports: string[]) => {
      const storage = await getStorage();
      const portNums = ports.map((p) => parseInt(p, 10));
      const invalid = portNums.filter((p) => isNaN(p) || p < 1 || p > 65535);
      if (invalid.length > 0) {
        console.error(`Invalid port numbers: ${invalid.join(', ')}`);
        process.exit(1);
      }
      if (!storage.groups) storage.groups = {};
      if (!storage.groups[groupName]) storage.groups[groupName] = [];
      const existing = new Set(storage.groups[groupName]);
      portNums.forEach((p) => existing.add(p));
      storage.groups[groupName] = Array.from(existing).sort((a, b) => a - b);
      await storage.save();
      console.log(`Group "${groupName}" now contains ports: ${storage.groups[groupName].join(', ')}`);
    });

  group
    .command('remove <groupName> <ports...>')
    .description('Remove ports from a named group')
    .action(async (groupName: string, ports: string[]) => {
      const storage = await getStorage();
      if (!storage.groups || !storage.groups[groupName]) {
        console.error(`Group "${groupName}" does not exist.`);
        process.exit(1);
      }
      const portNums = new Set(ports.map((p) => parseInt(p, 10)));
      storage.groups[groupName] = storage.groups[groupName].filter((p: number) => !portNums.has(p));
      await storage.save();
      console.log(`Updated group "${groupName}": ${storage.groups[groupName].join(', ') || '(empty)'}`);
    });

  group
    .command('list')
    .description('List all groups and their ports')
    .action(async () => {
      const storage = await getStorage();
      const groups = storage.groups || {};
      const names = Object.keys(groups);
      if (names.length === 0) {
        console.log('No groups defined.');
        return;
      }
      names.forEach((name) => {
        console.log(`${name}: ${groups[name].join(', ')}`);
      });
    });

  group
    .command('delete <groupName>')
    .description('Delete an entire group')
    .action(async (groupName: string) => {
      const storage = await getStorage();
      if (!storage.groups || !storage.groups[groupName]) {
        console.error(`Group "${groupName}" does not exist.`);
        process.exit(1);
      }
      delete storage.groups[groupName];
      await storage.save();
      console.log(`Group "${groupName}" deleted.`);
    });
}
