import { Command } from 'commander';
import { mergePortmaps, registerMergeCommand } from '../merge';
import { getStorage, resetStorage } from '../../../storage/index';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerMergeCommand(program);
  return program;
}

beforeEach(() => {
  resetStorage();
});

describe('mergePortmaps()', () => {
  it('adds new entries from incoming to base', () => {
    const base = { '3000': { label: 'frontend', tags: [] } };
    const incoming = { '4000': { label: 'backend', tags: [] } };
    const { merged, result } = mergePortmaps(base, incoming);
    expect(merged['4000']).toEqual({ label: 'backend', tags: [] });
    expect(result.added).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.overwritten).toBe(0);
  });

  it('skips conflicting entries by default', () => {
    const base = { '3000': { label: 'frontend', tags: [] } };
    const incoming = { '3000': { label: 'ui', tags: [] } };
    const { merged, result } = mergePortmaps(base, incoming, 'skip');
    expect(merged['3000'].label).toBe('frontend');
    expect(result.skipped).toBe(1);
  });

  it('overwrites conflicting entries when strategy is overwrite', () => {
    const base = { '3000': { label: 'frontend', tags: [] } };
    const incoming = { '3000': { label: 'ui-v2', tags: [] } };
    const { merged, result } = mergePortmaps(base, incoming, 'overwrite');
    expect(merged['3000'].label).toBe('ui-v2');
    expect(result.overwritten).toBe(1);
  });

  it('handles empty incoming portmap', () => {
    const base = { '3000': { label: 'frontend', tags: [] } };
    const { merged, result } = mergePortmaps(base, {});
    expect(Object.keys(merged)).toHaveLength(1);
    expect(result.added).toBe(0);
  });

  it('handles empty base portmap', () => {
    const incoming = { '5000': { label: 'api', tags: [] } };
    const { merged, result } = mergePortmaps({}, incoming);
    expect(merged['5000']).toBeDefined();
    expect(result.added).toBe(1);
  });
});

describe('merge command', () => {
  it('merges entries from a JSON file into storage', async () => {
    const fs = await import('fs/promises');
    const os = await import('os');
    const path = await import('path');

    const tmpFile = path.join(os.tmpdir(), `portmap-merge-test-${Date.now()}.json`);
    const incoming = { '9000': { label: 'test-service', tags: ['test'] } };
    await fs.writeFile(tmpFile, JSON.stringify(incoming), 'utf-8');

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'merge', tmpFile]);

    const storage = getStorage();
    const data = storage.load();
    expect(data['9000']).toBeDefined();
    expect(data['9000'].label).toBe('test-service');

    await fs.unlink(tmpFile);
  });

  it('exits with error when file does not exist', async () => {
    const program = buildProgram();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      program.parseAsync(['node', 'test', 'merge', '/nonexistent/file.json'])
    ).rejects.toThrow();
    mockExit.mockRestore();
  });
});
