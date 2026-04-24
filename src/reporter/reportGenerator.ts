import { getStorage } from '../storage';
import { formatReport, ReportOptions } from './reportFormatter';

export async function generateReport(options: ReportOptions): Promise<string> {
  const storage = await getStorage();
  const entries = Object.values(storage.ports);

  if (entries.length === 0) {
    return 'No ports have been registered yet. Run `portmap scan` to get started.';
  }

  return formatReport(entries, options);
}

export async function generatePortSummary(): Promise<{
  total: number;
  active: number;
  inactive: number;
  labeled: number;
}> {
  const storage = await getStorage();
  const entries = Object.values(storage.ports);

  return {
    total: entries.length,
    active: entries.filter((e) => e.active !== false).length,
    inactive: entries.filter((e) => e.active === false).length,
    labeled: entries.filter((e) => e.label && e.label.trim() !== '').length,
  };
}
