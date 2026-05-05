import { Command } from 'commander';
import { getStorage } from '../../storage/index';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

const VALID_PRIORITIES: PriorityLevel[] = ['low', 'medium', 'high', 'critical'];

function isValidPriority(value: string): value is PriorityLevel {
  return VALID_PRIORITIES.includes(value as PriorityLevel);
}

export function registerPriorityCommand(program: Command): void {
  const priority = program
    .command('priority')
    .description('Manage priority levels for port entries');

  priority
    .command('set <port> <level>')
    .description(`Set priority for a port (${VALID_PRIORITIES.join(', ')})`)
    .action((port: string, level: string) => {
      const portNum = parseInt(port, 10);
      if (isNaN(portNum)) {
        console.error(`Invalid port: ${port}`);
        process.exit(1);
      }
      if (!isValidPriority(level)) {
        console.error(`Invalid priority level: "${level}". Must be one of: ${VALID_PRIORITIES.join(', ')}`);
        process.exit(1);
      }
      const storage = getStorage();
      const entry = storage.get(portNum);
      if (!entry) {
        console.error(`No entry found for port ${portNum}`);
        process.exit(1);
      }
      storage.set(portNum, { ...entry, priority: level });
      console.log(`Priority for port ${portNum} set to "${level}"`);
    });

  priority
    .command('get <port>')
    .description('Get the priority level of a port')
    .action((port: string) => {
      const portNum = parseInt(port, 10);
      if (isNaN(portNum)) {
        console.error(`Invalid port: ${port}`);
        process.exit(1);
      }
      const storage = getStorage();
      const entry = storage.get(portNum);
      if (!entry) {
        console.error(`No entry found for port ${portNum}`);
        process.exit(1);
      }
      const level = (entry as any).priority ?? 'none';
      console.log(`Port ${portNum} priority: ${level}`);
    });

  priority
    .command('list')
    .description('List all ports sorted by priority')
    .action(() => {
      const storage = getStorage();
      const entries = storage.getAll();
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
      const sorted = entries
        .map((e) => ({ ...e, priority: (e as any).priority ?? 'none' }))
        .sort((a, b) => (order[a.priority] ?? 4) - (order[b.priority] ?? 4));
      if (sorted.length === 0) {
        console.log('No port entries found.');
        return;
      }
      sorted.forEach((e) => {
        console.log(`  [${e.priority.toUpperCase().padEnd(8)}] ${e.port}${e.label ? ` — ${e.label}` : ''}`);
      });
    });
}
