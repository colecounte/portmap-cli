import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { registerDiffCommand } from '../diff';
import { getStorage } from '../../../storage';

jest.mock('fs');
jest.mock('../../../storage');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockGetStorage = getStorage as jest.Mock;

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerDiffCommand(program);
  return program;
}

const snapshotDir = path.resolve(process.cwd(), 'snapshots');

const snapshotA = {
  timestamp: '2024-01-01T00:00:00.000Z',
  ports: {
    '3000': { label: 'frontend', tags: [] },
    '4000': { label: 'backend', tags: [] },
  },
};

const snapshotB = {
  timestamp: '2024-01-02T00:00:00.000Z',
  ports: {
    '3000': { label: 'web', tags: [] },
    '5000': { label: 'api', tags: [] },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
});

describe('diff command', () => {
  it('shows added, removed, and changed ports between two snapshots', async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync
      .mockReturnValueOnce(JSON.stringify(snapshotA))
      .mockReturnValueOnce(JSON.stringify(snapshotB));

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'diff', 'snap-a', 'snap-b']);

    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('Removed:');
    expect(output).toContain('4000');
    expect(output).toContain('Added:');
    expect(output).toContain('5000');
    expect(output).toContain('Changed:');
    expect(output).toContain('3000');
    consoleSpy.mockRestore();
  });

  it('reports no differences when snapshots are identical', async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync
      .mockReturnValueOnce(JSON.stringify(snapshotA))
      .mockReturnValueOnce(JSON.stringify(snapshotA));

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'diff', 'snap-a', 'snap-a']);

    expect(consoleSpy).toHaveBeenCalledWith('No differences found between snapshots.');
    consoleSpy.mockRestore();
  });

  it('exits with error if snapshotA file is missing', async () => {
    mockFs.existsSync.mockReturnValue(false);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const program = buildProgram();

    await expect(
      program.parseAsync(['node', 'test', 'diff', 'missing', 'snap-b'])
    ).rejects.toThrow('process.exit');

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('missing'));
    errorSpy.mockRestore();
  });

  it('compares snapshotA against current live port map with --current flag', async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValueOnce(JSON.stringify(snapshotA));
    mockGetStorage.mockReturnValue({
      load: () => ({ '3000': { label: 'frontend', tags: [] }, '9000': { label: 'new', tags: [] } }),
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'diff', 'snap-a', 'ignored', '--current']);

    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('Added:');
    expect(output).toContain('9000');
    consoleSpy.mockRestore();
  });
});
