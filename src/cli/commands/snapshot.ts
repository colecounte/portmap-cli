import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { getStorage } from '../../storage/index';
import { formatJson } from '../../reporter/reportFormatter';

export interface SnapshotEntry {
  timestamp: string;
  ports: Record<string, unknown>;
}

export function registerSnapshotCommand(program: Command): void {
  program
    .command('snapshot')
    .description('Save a timestamped snapshot of the current port map to a file')
    .option('-o, --output <dir>', 'Directory to write snapshot file', '.')
    .option('--name <name>', 'Custom snapshot filename (without extension)')
    .action(async (options: { output: string; name?: string }) => {
      const storage = getStorage();
      const ports = storage.getAll();

      if (Object.keys(ports).length === 0) {
        console.log('No port entries found. Snapshot not created.');
        return;
      }

      const timestamp = new Date().toISOString();
      const snapshot: SnapshotEntry = { timestamp, ports };

      const filename = options.name
        ? `${options.name}.json`
        : `portmap-snapshot-${timestamp.replace(/[:.]/g, '-')}.json`;

      const outputDir = path.resolve(options.output);

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filePath = path.join(outputDir, filename);
      const content = formatJson(ports);

      fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
      console.log(`Snapshot saved to: ${filePath}`);
      console.log(`Captured ${Object.keys(ports).length} port(s) at ${timestamp}`);
    });
}
