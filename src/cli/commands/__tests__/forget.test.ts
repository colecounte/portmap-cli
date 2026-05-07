import { Command } from 'commander';
import { registerForgetCommand } from '../forget';
import { getStorage, resetStorage } from '../../../storage/index';
import * as historyStore from '../../../storage/historyStore';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerForgetCommand(program);
  return program;
}

beforeEach(() => {
  resetStorage();
  jest.spyOn(historyStore, 'appendHistory').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('forget command', () => {
  it('removes a registered port with --force', async () => {
    const storage = getStorage();
    storage.write({ 3000: { label: 'api', tags: [] } });

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'forget', '3000', '--force']);

    const portmap = storage.read();
    expect(portmap[3000]).toBeUndefined();
  });

  it('appends a forgotten history entry by default', async () => {
    const storage = getStorage();
    storage.write({ 4000: { label: 'worker', tags: [] } });

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'forget', '4000', '--force']);

    expect(historyStore.appendHistory).toHaveBeenCalledWith(
      4000,
      expect.objectContaining({ event: 'forgotten', label: 'worker' })
    );
  });

  it('skips history entry when --keep-history is passed', async () => {
    const storage = getStorage();
    storage.write({ 5000: { label: 'frontend', tags: [] } });

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'forget', '5000', '--force', '--keep-history']);

    expect(historyStore.appendHistory).not.toHaveBeenCalled();
  });

  it('exits with error for unregistered port', async () => {
    const program = buildProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: number) => { throw new Error(`exit:${code}`); });

    await expect(
      program.parseAsync(['node', 'test', 'forget', '9999', '--force'])
    ).rejects.toThrow('exit:1');

    exitSpy.mockRestore();
  });

  it('exits with error for invalid port number', async () => {
    const program = buildProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: number) => { throw new Error(`exit:${code}`); });

    await expect(
      program.parseAsync(['node', 'test', 'forget', 'abc', '--force'])
    ).rejects.toThrow('exit:1');

    exitSpy.mockRestore();
  });

  it('prints confirmation hint without --force', async () => {
    const storage = getStorage();
    storage.write({ 8080: { label: 'proxy', tags: [] } });

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: number) => { throw new Error(`exit:${code}`); });

    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'test', 'forget', '8080'])
    ).rejects.toThrow('exit:0');

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('--force'));

    logSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
