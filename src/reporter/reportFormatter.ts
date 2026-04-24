import { PortEntry } from '../storage/portmap';

export type ReportFormat = 'table' | 'json' | 'csv';

export interface ReportOptions {
  format: ReportFormat;
  showInactive?: boolean;
}

export function formatReport(entries: PortEntry[], options: ReportOptions): string {
  const filtered = options.showInactive
    ? entries
    : entries.filter((e) => e.active !== false);

  switch (options.format) {
    case 'json':
      return formatJson(filtered);
    case 'csv':
      return formatCsv(filtered);
    case 'table':
    default:
      return formatTable(filtered);
  }
}

function formatTable(entries: PortEntry[]): string {
  if (entries.length === 0) return 'No port entries found.';

  const header = `${'PORT'.padEnd(8)}${'LABEL'.padEnd(24)}${'STATUS'.padEnd(12)}LAST SEEN`;
  const divider = '-'.repeat(60);

  const rows = entries.map((e) => {
    const port = String(e.port).padEnd(8);
    const label = (e.label || '—').padEnd(24);
    const status = (e.active ? 'active' : 'inactive').padEnd(12);
    const lastSeen = e.lastSeen ? new Date(e.lastSeen).toLocaleString() : 'unknown';
    return `${port}${label}${status}${lastSeen}`;
  });

  return [header, divider, ...rows].join('\n');
}

function formatJson(entries: PortEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

function formatCsv(entries: PortEntry[]): string {
  const header = 'port,label,active,lastSeen';
  const rows = entries.map((e) =>
    [
      e.port,
      `"${(e.label || '').replace(/"/g, '""')}"`,
      e.active ?? true,
      e.lastSeen ?? '',
    ].join(',')
  );
  return [header, ...rows].join('\n');
}
