import { Command } from 'commander';
import { getStorage } from '../../storage';
import { formatTable, formatJson, formatCsv } from '../../reporter/reportFormatter';

export function registerHistoryCommand(program: Command): void {
  program
    .command('history')
    .description('Show scan history and port activity over time')
    .option('-n, --limit <number>', 'Limit number of history entries to show', '20')
    .option('-p, --port <number>', 'Filter history for a specific port')
    .option('-f, --format <format>', 'Output format: table, json, csv', 'table')
    .option('--clear', 'Clear all history entries')
    .action(async (options) => {
      const storage = await getStorage();
      const history = storage.getHistory ? await storage.getHistory() : [];

      if (options.clear) {
        if (storage.clearHistory) {
          await storage.clearHistory();
          console.log('History cleared.');
        } else {
          console.log('History clearing not supported.');
        }
        return;
      }

      const limit = parseInt(options.limit, 10);
      const portFilter = options.port ? parseInt(options.port, 10) : null;

      let entries = portFilter
        ? history.filter((e: HistoryEntry) => e.port === portFilter)
        : history;

      entries = entries.slice(-limit).reverse();

      if (entries.length === 0) {
        console.log('No history entries found.');
        return;
      }

      const rows = entries.map((e: HistoryEntry) => ({
        port: e.port,
        label: e.label || '',
        status: e.status,
        scannedAt: new Date(e.scannedAt).toLocaleString(),
      }));

      if (options.format === 'json') {
        console.log(formatJson(rows));
      } else if (options.format === 'csv') {
        console.log(formatCsv(rows));
      } else {
        console.log(formatTable(rows));
      }
    });
}

export interface HistoryEntry {
  port: number;
  label?: string;
  status: 'open' | 'closed';
  scannedAt: number;
}
