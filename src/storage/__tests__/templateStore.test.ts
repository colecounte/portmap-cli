import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  listTemplates,
  saveTemplate,
  getTemplate,
  applyTemplate,
  deleteTemplate,
} from '../templateStore';

const TEMPLATE_DIR = path.join(os.homedir(), '.portmap', 'templates');

const mockEntry = { label: 'api', tags: [], note: '', pinned: false, priority: 'medium' as const };

beforeEach(() => {
  if (fs.existsSync(TEMPLATE_DIR)) {
    fs.readdirSync(TEMPLATE_DIR).forEach(f => fs.unlinkSync(path.join(TEMPLATE_DIR, f)));
  }
});

describe('templateStore', () => {
  it('returns empty list when no templates exist', () => {
    expect(listTemplates()).toEqual([]);
  });

  it('saves and retrieves a template', () => {
    saveTemplate('webstack', { 3000: mockEntry }, 'Web dev stack');
    const tpl = getTemplate('webstack');
    expect(tpl).not.toBeNull();
    expect(tpl!.name).toBe('webstack');
    expect(tpl!.description).toBe('Web dev stack');
    expect(tpl!.ports[3000]).toMatchObject({ label: 'api' });
  });

  it('lists saved templates sorted by name', () => {
    saveTemplate('zoo', { 4000: mockEntry });
    saveTemplate('alpha', { 5000: mockEntry });
    const names = listTemplates().map(t => t.name);
    expect(names).toEqual(['alpha', 'zoo']);
  });

  it('applies a template without overwrite skips existing', () => {
    saveTemplate('basic', { 3000: mockEntry });
    const storage = new Map<number, typeof mockEntry>();
    storage.set(3000, { ...mockEntry, label: 'existing' });
    const fakeStorage = {
      get: (p: number) => storage.get(p),
      set: (p: number, e: typeof mockEntry) => storage.set(p, e),
    };
    const result = applyTemplate('basic', fakeStorage, false);
    expect(result.success).toBe(true);
    expect(result.applied).toBe(0);
    expect(storage.get(3000)!.label).toBe('existing');
  });

  it('applies a template with overwrite replaces existing', () => {
    saveTemplate('basic', { 3000: mockEntry });
    const storage = new Map<number, typeof mockEntry>();
    storage.set(3000, { ...mockEntry, label: 'existing' });
    const fakeStorage = {
      get: (p: number) => storage.get(p),
      set: (p: number, e: typeof mockEntry) => storage.set(p, e),
    };
    const result = applyTemplate('basic', fakeStorage, true);
    expect(result.applied).toBe(1);
    expect(storage.get(3000)!.label).toBe('api');
  });

  it('returns error when applying non-existent template', () => {
    const fakeStorage = { get: () => undefined, set: () => {} };
    const result = applyTemplate('ghost', fakeStorage, false);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/);
  });

  it('deletes a template', () => {
    saveTemplate('temp', { 8080: mockEntry });
    expect(deleteTemplate('temp')).toBe(true);
    expect(getTemplate('temp')).toBeNull();
  });

  it('returns false when deleting non-existent template', () => {
    expect(deleteTemplate('nope')).toBe(false);
  });
});
