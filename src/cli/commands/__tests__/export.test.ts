import { Command } from 'commander';
import * as fs from 'fs';
import { registerExportCommand } from '../export';
import { getStorage, resetStorage } from '../../../storage/index';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerExportCommand(program);
  return program;
}

describe('export command', () => {
  beforeEach(() => {
    resetStorage();
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exports portmap as JSON by default', async () => {
    const storage = getStorage();
    storage.save({ '3000': { label: 'api', addedAt: '2024-01-01' } });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();

    await program.parseAsync(['node', 'test', 'export', '--output', 'portmap.json']);

    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    const [, content] = (fs.writeFileSync as jest.Mock).mock.calls[0];
    expect(() => JSON.parse(content)).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('format: json'));
  });

  it('exports portmap as CSV when --format csv', async () => {
    const storage = getStorage();
    storage.save({ '4000': { label: 'web', addedAt: '2024-01-02' } });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();

    await program.parseAsync(['node', 'test', 'export', '--output', 'portmap.csv', '--format', 'csv']);

    const [, content] = (fs.writeFileSync as jest.Mock).mock.calls[0];
    expect(content).toContain('port');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('format: csv'));
  });

  it('exits with error for invalid format', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();

    await expect(
      program.parseAsync(['node', 'test', 'export', '--output', 'out.txt', '--format', 'xml'])
    ).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid format'));
    exitSpy.mockRestore();
  });

  it('requires --output option', async () => {
    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'test', 'export'])
    ).rejects.toThrow();
  });
});
