import { Command } from 'commander';
import { getStorage } from '../../storage/index';

export interface ResolveResult {
  port: number;
  label?: string;
  alias?: string;
  matched: boolean;
}

/**
 * Resolve a port number from a label, alias, or raw port number.
 * Returns the canonical port entry if found.
 */
export function resolvePort(query: string): ResolveResult {
  const storage = getStorage();
  const portmap = storage.load();

  // Try direct port number match
  const asNumber = parseInt(query, 10);
  if (!isNaN(asNumber)) {
    const entry = portmap[asNumber];
    if (entry) {
      return {
        port: asNumber,
        label: entry.label,
        alias: entry.alias,
        matched: true,
      };
    }
    return { port: asNumber, matched: false };
  }

  // Try label match (case-insensitive)
  const lowerQuery = query.toLowerCase();
  for (const [portStr, entry] of Object.entries(portmap)) {
    if (entry.label && entry.label.toLowerCase() === lowerQuery) {
      return {
        port: parseInt(portStr, 10),
        label: entry.label,
        alias: entry.alias,
        matched: true,
      };
    }
  }

  // Try alias match (case-insensitive)
  for (const [portStr, entry] of Object.entries(portmap)) {
    if (entry.alias && entry.alias.toLowerCase() === lowerQuery) {
      return {
        port: parseInt(portStr, 10),
        label: entry.label,
        alias: entry.alias,
        matched: true,
      };
    }
  }

  return { port: NaN, matched: false };
}

export function registerResolveCommand(program: Command): void {
  program
    .command('resolve <query>')
    .description('Resolve a port number from a label, alias, or port number')
    .option('--json', 'Output result as JSON')
    .action((query: string, options: { json?: boolean }) => {
      const result = resolvePort(query);

      if (!result.matched) {
        console.error(`No port found matching "${query}"`);
        process.exit(1);
      }

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        const parts = [`Port: ${result.port}`];
        if (result.label) parts.push(`Label: ${result.label}`);
        if (result.alias) parts.push(`Alias: ${result.alias}`);
        console.log(parts.join('  |  '));
      }
    });
}
