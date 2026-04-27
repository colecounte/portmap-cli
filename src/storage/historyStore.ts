import * as fs from 'fs';
import * as path from 'path';
import { HistoryEntry } from '../cli/commands/history';

const HISTORY_FILE = path.join(
  process.env.PORTMAP_DIR || path.join(process.env.HOME || '.', '.portmap'),
  'history.json'
);

const MAX_HISTORY_ENTRIES = 500;

function ensureDir(): void {
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function readHistory(): HistoryEntry[] {
  ensureDir();
  if (!fs.existsSync(HISTORY_FILE)) return [];
  try {
    const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function appendHistory(entries: HistoryEntry[]): void {
  ensureDir();
  const existing = readHistory();
  const combined = [...existing, ...entries];
  const trimmed = combined.slice(-MAX_HISTORY_ENTRIES);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
}

export function clearHistory(): void {
  ensureDir();
  fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2), 'utf-8');
}

export function getHistoryForPort(port: number): HistoryEntry[] {
  return readHistory().filter((e) => e.port === port);
}
