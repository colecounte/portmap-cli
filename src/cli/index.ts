#!/usr/bin/env node
import { Command } from 'commander';
import { scanCommand } from './commands/scan';

const program = new Command();

program
  .name('portmap')
  .description('Scan, label, and persist local port assignments across dev sessions')
  .version('1.0.0');

program
  .command('scan')
  .description('Scan a range of ports for open connections')
  .requiredOption('-s, --start <number>', 'Start of port range', parseInt)
  .requiredOption('-e, --end <number>', 'End of port range', parseInt)
  .option('-f, --format <type>', 'Output format: table | json | csv', 'table')
  .option('--save', 'Persist open ports to storage', false)
  .action(async (opts) => {
    try {
      await scanCommand({
        start: opts.start,
        end: opts.end,
        format: opts.format,
        save: opts.save,
      });
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
