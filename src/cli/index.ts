import { Command } from 'commander';
import { registerScanCommand } from './commands/scan';
import { registerLabelCommand } from './commands/label';
import { registerReportCommand } from './commands/report';

const program = new Command();

program
  .name('portmap')
  .description('Lightweight utility to scan, label, and persist local port assignments across dev sessions')
  .version('1.0.0');

registerScanCommand(program);
registerLabelCommand(program);
registerReportCommand(program);

program
  .command('clear')
  .description('Clear all stored port data')
  .action(async () => {
    const { resetStorage } = await import('../storage/index');
    await resetStorage();
    console.log('Port map cleared.');
  });

program.addHelpText('after', `
Examples:
  $ portmap scan --range 3000-4000
  $ portmap label set 3000 api-server
  $ portmap label list
  $ portmap report --format json
  $ portmap report --open-only --output report.csv --format csv
`);

export { program };

if (require.main === module) {
  program.parse(process.argv);
}
