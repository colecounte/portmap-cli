import { Command } from 'commander';
import { registerPinCommand } from '../pin';
import { getStorage, resetStorage } from '../../../storage/index';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerPinCommand(program);
  return program;
}

describe('pin command', () => {
  beforeEach(() => {
    resetStorage();
  });

  it('pins an existing port entry', async () => {
    const storage = getStorage();
    storage.save({ 3000: { label: 'dev-server', pinned: false, tags: [] } });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['pin', '3000'], { from: 'user' });

    const map = storage.load();
    expect(map[3000].pinned).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('pinned'));
    consoleSpy.mockRestore();
  });

  it('unpins a pinned port entry', async () => {
    const storage = getStorage();
    storage.save({ 4000: { label: 'api', pinned: true, tags: [] } });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['pin', '4000', '--unpin'], { from: 'user' });

    const map = storage.load();
    expect(map[4000].pinned).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('unpinned'));
    consoleSpy.mockRestore();
  });

  it('warns if port is already pinned', async () => {
    const storage = getStorage();
    storage.save({ 5000: { label: 'frontend', pinned: true, tags: [] } });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['pin', '5000'], { from: 'user' });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('already pinned'));
    consoleSpy.mockRestore();
  });

  it('exits with error for unknown port', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    const program = buildProgram();
    await program.parseAsync(['pin', '9999'], { from: 'user' });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No entry found'));
    expect(exitSpy).toHaveBeenCalledWith(1);
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('exits with error for invalid port number', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    const program = buildProgram();
    await program.parseAsync(['pin', 'abc'], { from: 'user' });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid port number'));
    expect(exitSpy).toHaveBeenCalledWith(1);
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
