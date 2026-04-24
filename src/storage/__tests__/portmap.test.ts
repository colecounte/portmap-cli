import fs from 'fs';
import path from 'path';
import os from 'os';
import { PortMapStorage, PortMap } from '../portmap';

describe('PortMapStorage', () => {
  let tmpDir: string;
  let storage: PortMapStorage;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'portmap-test-'));
    storage = new PortMapStorage(path.join(tmpDir, '.portmap.json'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty portmap when file does not exist', () => {
    const result = storage.load();
    expect(result.version).toBe(1);
    expect(result.entries).toEqual({});
  });

  it('saves and loads a portmap correctly', () => {
    const portMap: PortMap = {
      version: 1,
      entries: {
        3000: { port: 3000, label: 'frontend', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
      },
    };
    storage.save(portMap);
    const loaded = storage.load();
    expect(loaded.entries[3000].label).toBe('frontend');
  });

  it('adds a new port entry', () => {
    const entry = storage.addOrUpdate(8080, 'api-server', 'Main API');
    expect(entry.port).toBe(8080);
    expect(entry.label).toBe('api-server');
    expect(entry.description).toBe('Main API');
    expect(entry.createdAt).toBe(entry.updatedAt);
  });

  it('updates an existing port entry and preserves createdAt', () => {
    storage.addOrUpdate(8080, 'api-server');
    const updated = storage.addOrUpdate(8080, 'api-server-v2');
    expect(updated.label).toBe('api-server-v2');
    const all = storage.list();
    expect(all).toHaveLength(1);
  });

  it('removes an existing entry and returns true', () => {
    storage.addOrUpdate(5000, 'dev');
    const removed = storage.remove(5000);
    expect(removed).toBe(true);
    expect(storage.list()).toHaveLength(0);
  });

  it('returns false when removing a non-existent entry', () => {
    const removed = storage.remove(9999);
    expect(removed).toBe(false);
  });

  it('lists entries sorted by port number', () => {
    storage.addOrUpdate(9000, 'service-c');
    storage.addOrUpdate(3000, 'service-a');
    storage.addOrUpdate(5000, 'service-b');
    const list = storage.list();
    expect(list.map((e) => e.port)).toEqual([3000, 5000, 9000]);
  });
});
