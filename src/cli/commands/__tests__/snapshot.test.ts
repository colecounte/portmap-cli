import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { registerSnapshotCommand } from '../snapshot';
import { getStorage, resetStorage } from '../../../storage/index';

jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerSnapshotCommand(program);
  return program;
}

describe('snapshot command', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    resetStorage();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.mkdirSync.mockImplementation(() => undefined);
    mockedFs.writeFileSync.mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('should print message when no ports are stored', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'snapshot']);
    expect(consoleSpy).toHaveBeenCalledWith(
      'No port entries found. Snapshot not created.'
    );
    expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
  });

  it('should write snapshot file when ports exist', async () => {
    const storage = getStorage();
    storage.set(3000, { label: 'api', tags: [], note: '' });

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'snapshot', '-o', '/tmp']);

    expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
    const [filePath, content] = mockedFs.writeFileSync.mock.calls[0];
    expect(filePath).toMatch(/portmap-snapshot-.+\.json$/);
    const parsed = JSON.parse(content as string);
    expect(parsed).toHaveProperty('timestamp');
    expect(parsed).toHaveProperty('ports');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Snapshot saved to:'));
  });

  it('should use custom name when --name is provided', async () => {
    const storage = getStorage();
    storage.set(8080, { label: 'web', tags: [], note: '' });

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'snapshot', '--name', 'my-snapshot']);

    const [filePath] = mockedFs.writeFileSync.mock.calls[0];
    expect(filePath).toMatch(/my-snapshot\.json$/);
  });

  it('should create output directory if it does not exist', async () => {
    mockedFs.existsSync.mockReturnValue(false);
    const storage = getStorage();
    storage.set(5000, { label: 'db', tags: [], note: '' });

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'snapshot', '-o', '/tmp/snapshots']);

    expect(mockedFs.mkdirSync).toHaveBeenCalledWith(
      path.resolve('/tmp/snapshots'),
      { recursive: true }
    );
  });
});
