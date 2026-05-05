import { Command } from 'commander';
import { getStorage } from '../../storage/index';
import { PortEntry } from '../../storage/portmap';

type EnvFormat = 'dotenv' | 'shell' | 'json';

function sanitizeKey(label: string): string {
  return label.toUpperCase().replace(/[^A-Z0-9]/g, '_');
}

function generateDotenv(entries: PortEntry[]): string {
  return entries
    .filter((e) => e.label)
    .map((e) => `PORT_${sanitizeKey(e.label!)}=${e.port}`)
    .join('\n');
}

function generateShell(entries: PortEntry[]): string {
  return entries
    .filter((e) => e.label)
    .map((e) => `export PORT_${sanitizeKey(e.label!)}=${e.port}`)
    .join('\n');
}

function generateJsonEnv(entries: PortEntry[]): string {
  const obj: Record<string, number> = {};
  for (const e of entries) {
    if (e.label) {
      obj[`PORT_${sanitizeKey(e.label)}`] = e.port;
    }
  }
  return JSON.stringify(obj, null, 2);
}

export function registerEnvCommand(program: Command): void {
  program
    .command('env')
    .description('Generate environment variable declarations from labeled ports')
    .option('-f, --format <format>', 'Output format: dotenv | shell | json', 'dotenv')
    .option('-o, --only-labeled', 'Only include entries with labels (default: true)')
    .action((options) => {
      const storage = getStorage();
      const entries = Object.values(storage.ports) as PortEntry[];

      const format: EnvFormat = options.format as EnvFormat;
      const labeled = entries.filter((e) => e.label);

      if (labeled.length === 0) {
        console.log('# No labeled ports found.');
        return;
      }

      switch (format) {
        case 'dotenv':
          console.log(generateDotenv(labeled));
          break;
        case 'shell':
          console.log(generateShell(labeled));
          break;
        case 'json':
          console.log(generateJsonEnv(labeled));
          break;
        default:
          console.error(`Unknown format: ${format}. Use dotenv, shell, or json.`);
          process.exit(1);
      }
    });
}
