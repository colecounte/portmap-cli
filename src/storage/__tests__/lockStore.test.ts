import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { LockStore } from '../lockStore';

const LOCK_FILE = path.join(os.homedir(), '.portmap', 'locks.json');

beforeEach(async () => {
  try {
    await fs.unlink(LOCK_FILE);
  } catch {
    // ignore if not exists
  }
});

describe('LockStore', () => {
  it('locks a port and reads it back', async () => {
    const store = new LockStore();
    await store.lockPort(3000, 'main api');
    const locked = await store.isLocked(3000);
    expect(locked).toBe(true);
  });

  it('stores reason and lockedAt', async () => {
    const store = new LockStore();
    await store.lockPort(4000, 'dev server');
    const entry = await store.getLock(4000);
    expect(entry).toBeDefined();
    expect(entry?.reason).toBe('dev server');
    expect(entry?.lockedAt).toBeTruthy();
  });

  it('returns false for unlocked port', async () => {
    const store = new LockStore();
    const locked = await store.isLocked(9999);
    expect(locked).toBe(false);
  });

  it('unlocks a locked port', async () => {
    const store = new LockStore();
    await store.lockPort(5000);
    const result = await store.unlockPort(5000);
    expect(result).toBe(true);
    expect(await store.isLocked(5000)).toBe(false);
  });

  it('returns false when unlocking a non-locked port', async () => {
    const store = new LockStore();
    const result = await store.unlockPort(7777);
    expect(result).toBe(false);
  });

  it('lists all locked ports', async () => {
    const store = new LockStore();
    await store.lockPort(3001);
    await store.lockPort(3002, 'reason');
    const list = await store.listLocks();
    expect(list.map((l) => l.port)).toContain(3001);
    expect(list.map((l) => l.port)).toContain(3002);
  });

  it('updates existing lock entry', async () => {
    const store = new LockStore();
    await store.lockPort(6000, 'old reason');
    await store.lockPort(6000, 'new reason');
    const list = await store.listLocks();
    const entries = list.filter((l) => l.port === 6000);
    expect(entries).toHaveLength(1);
    expect(entries[0].reason).toBe('new reason');
  });
});
