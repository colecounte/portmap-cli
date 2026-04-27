import { checkPort } from '../../scanner/portScanner';
import { getStorage } from '../../storage';
import { formatReport } from '../../reporter/reportFormatter';

export interface ScanOptions {
  start: number;
  end: number;
  format?: 'table' | 'json' | 'csv';
  save?: boolean;
}

export interface ScanResult {
  port: number;
  open: boolean;
  label?: string;
}

export async function scanCommand(options: ScanOptions): Promise<ScanResult[]> {
  const { start, end, format = 'table', save = false } = options;

  if (start < 1 || end > 65535 || start > end) {
    throw new Error(`Invalid port range: ${start}-${end}`);
  }

  const storage = getStorage();
  const results: ScanResult[] = [];

  const portChecks = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  for (const port of portChecks) {
    const open = await checkPort(port);
    const entry = storage.get(port);
    results.push({
      port,
      open,
      label: entry?.label,
    });

    if (save && open) {
      storage.set(port, { port, label: entry?.label ?? '', lastSeen: new Date().toISOString() });
    }
  }

  const openPorts = results.filter((r) => r.open);
  const output = formatReport(openPorts, format);
  console.log(output);

  return results;
}
