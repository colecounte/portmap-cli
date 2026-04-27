import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { getStorage } from '../../storage/index';
import { formatJson, formatCsv, formatTable } from '../../reporter/reportFormatter';

export type ExportFormat = 'json' | 'csv' | 'table';

export function registerExportCommand(program: Command): void {
  program
    .command('export')
    .description('Export the portmap to a file')
    .requiredOption('-o, --output <filepath>', 'Output file path')
    .option('-f, --format <format>', 'Export format: json | csv | table', 'json')
    .action((options) => {
      const format = options.format as ExportFormat;
      const validFormats: ExportFormat[] = ['json', 'csv', 'table'];

      if (!validFormats.includes(format)) {
        console.error(`Invalid format "${format}". Choose from: json, csv, table.`);
        process.exit(1);
      }

      const storage = getStorage();
      const portmap = storage.load();

      let content: string;
      switch (format) {
        case 'csv':
          content = formatCsv(portmap);
          break;
        case 'table':
          content = formatTable(portmap);
          break;
        case 'json':
        default:
          content = formatJson(portmap);
          break;
      }

      const outputPath = path.resolve(options.output);
      fs.writeFileSync(outputPath, content, 'utf-8');
      console.log(`Exported portmap to ${outputPath} (format: ${format})`);
    });
}
