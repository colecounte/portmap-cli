import { Command } from 'commander';
import { getStorage } from '../../storage/index';
import { generateReport } from '../../reporter/reportGenerator';
import { formatReport } from '../../reporter/reportFormatter';

type OutputFormat = 'table' | 'json' | 'csv';

export function registerReportCommand(program: Command): void {
  program
    .command('report')
    .description('Generate a report of scanned and labeled ports')
    .option('-f, --format <format>', 'Output format: table | json | csv', 'table')
    .option('-o, --output <file>', 'Write report to a file instead of stdout')
    .option('--open-only', 'Include only open ports in the report', false)
    .action(async (options: { format: string; output?: string; openOnly: boolean }) => {
      const format = options.format as OutputFormat;
      const validFormats: OutputFormat[] = ['table', 'json', 'csv'];
      if (!validFormats.includes(format)) {
        console.error(`Error: Unknown format "${format}". Use one of: ${validFormats.join(', ')}`);
        process.exit(1);
      }

      const storage = await getStorage();
      const report = generateReport(storage, { openOnly: options.openOnly });
      const output = formatReport(report, format);

      if (options.output) {
        const fs = await import('fs/promises');
        await fs.writeFile(options.output, output, 'utf-8');
        console.log(`Report written to ${options.output}`);
      } else {
        console.log(output);
      }
    });
}
