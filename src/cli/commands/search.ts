import { Command } from 'commander';
import { getStorage } from '../../storage/index';
import { formatTable, formatJson, formatCsv } from '../../reporter/reportFormatter';

export function registerSearchCommand(program: Command): void {
  program
    .command('search <query>')
    .description('Search port entries by label, tag, or note')
    .option('-f, --format <format>', 'output format: table, json, csv', 'table')
    .option('--tag', 'search only in tags')
    .option('--label', 'search only in labels')
    .option('--note', 'search only in notes')
    .action((query: string, options) => {
      const storage = getStorage();
      const entries = Object.values(storage.ports);

      const lowerQuery = query.toLowerCase();

      const results = entries.filter((entry) => {
        if (options.tag) {
          return entry.tags?.some((t) => t.toLowerCase().includes(lowerQuery));
        }
        if (options.label) {
          return entry.label?.toLowerCase().includes(lowerQuery);
        }
        if (options.note) {
          return entry.note?.toLowerCase().includes(lowerQuery);
        }
        return (
          entry.label?.toLowerCase().includes(lowerQuery) ||
          entry.tags?.some((t) => t.toLowerCase().includes(lowerQuery)) ||
          entry.note?.toLowerCase().includes(lowerQuery)
        );
      });

      if (results.length === 0) {
        console.log(`No entries found matching "${query}".`);
        return;
      }

      switch (options.format) {
        case 'json':
          console.log(formatJson(results));
          break;
        case 'csv':
          console.log(formatCsv(results));
          break;
        default:
          console.log(formatTable(results));
      }
    });
}
