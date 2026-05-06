import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export interface LockEntry {
  port: number;
  reason?: string;
  lockedAt: string;
}

const LOCK_DIR = path.join(os.homedir(), '.portmap');
const LOCK_FILE = path.join(LOCK_DIR, 'locks.json');

async function ensureDir(): Promise<void> {
  await fs.mkdir(LOCK_DIR, { recursive: true });
}

async function readLocks(): Promise<LockEntry[]> {
  try {
    const data = await fs.readFile(LOCK_FILE, 'utf-8');
    return JSON.parse(data) as LockEntry[];
  } catch {
    return [];
  }
}

async function writeLocks(locks: LockEntry[]): Promise<void> {
  await ensureDir();
  await fs.writeFile(LOCK_FILE, JSON.stringify(locks, null, 2), 'utf-8');
}

export class LockStore {
  async lockPort(port: number, reason?: string): Promise<void> {
    const locks = await readLocks();
    const existing = locks.findIndex((l) => l.port === port);
    const entry: LockEntry = { port, reason, lockedAt: new Date().toISOString() };
    if (existing >= 0) {
      locks[existing] = entry;
    } else {
      locks.push(entry);
    }
    await writeLocks(locks);
  }

  async unlockPort(port: number): Promise<boolean> {
    const locks = await readLocks();
    const idx = locks.findIndex((l) => l.port === port);
    if (idx < 0) return false;
    locks.splice(idx, 1);
    await writeLocks(locks);
    return true;
  }

  async isLocked(port: number): Promise<boolean> {
    const locks = await readLocks();
    return locks.some((l) => l.port === port);
  }

  async listLocks(): Promise<LockEntry[]> {
    return readLocks();
  }

  async getLock(port: number): Promise<LockEntry | undefined> {
    const locks = await readLocks();
    return locks.find((l) => l.port === port);
  }
}
