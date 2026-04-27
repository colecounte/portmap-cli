import { Command } from 'commander';
import { registerClearCommand } from '../clear';
import { getStorage, resetStorage } from '../../../storage/index';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerClearCommand(program);
  return program;
}

describe('clear command', () => {
  beforeEach(() => {
    resetStorage();
  });

  it('removes a specific port with --port flag', async () => {
    const storage = getStorage();
    storage.save({ '3000': { label: 'api', addedAt: '2024-01-01' }, '4000': { label: 'web', addedAt: '2024-01-01' } });

    const program = buildProgram();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await program.parseAsync(['node', 'test', 'clear', '--port', '3000']);

    const result = storage.load();
    expect(result['3000']).toBeUndefined();
    expect(result['4000']).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith('Removed port 3000 from portmap.');
    consoleSpy.mockRestore();
  });

  it('clears all entries with --all flag', async () => {
    const storage = getStorage();
    storage.save({ '3000': { label: 'api', addedAt: '2024-01-01' }, '4000': { label: 'web', addedAt: '2024-01-01' } });

    const program = buildProgram();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await program.parseAsync(['node', 'test', 'clear', '--all']);

    const result = storage.load();
    expect(Object.keys(result)).toHaveLength(0);
    expect(consoleSpy).toHaveBeenCalledWith('Cleared all 2 port entries.');
    consoleSpy.mockRestore();
  });

  it('exits with error when port not found', async () => {
    const storage = getStorage();
    storage.save({});

    const program = buildProgram();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(program.parseAsync(['node', 'test', 'clear', '--port', '9999'])).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith('Port 9999 not found in portmap.');

    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('exits with error when no flags provided', async () => {
    const program = buildProgram();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(program.parseAsync(['node', 'test', 'clear'])).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith('Please specify --port <number>, --inactive, or --all.');

    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
