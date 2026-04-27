import { Command } from 'commander';
import { registerTagCommand } from '../tag';
import { getStorage, resetStorage } from '../../../storage/index';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerTagCommand(program);
  return program;
}

describe('tag command', () => {
  beforeEach(() => {
    resetStorage();
  });

  it('adds tags to an existing port entry', async () => {
    const storage = getStorage();
    storage.setPort(3000, { port: 3000, label: 'api', status: 'open', tags: [] });

    const program = buildProgram();
    await program.parseAsync(['tag', '3000', 'backend', 'api'], { from: 'user' });

    const entry = storage.getPort(3000);
    expect(entry?.tags).toEqual(['backend', 'api']);
  });

  it('does not duplicate existing tags', async () => {
    const storage = getStorage();
    storage.setPort(3000, { port: 3000, label: 'api', status: 'open', tags: ['backend'] });

    const program = buildProgram();
    await program.parseAsync(['tag', '3000', 'backend', 'new-tag'], { from: 'user' });

    const entry = storage.getPort(3000);
    expect(entry?.tags).toEqual(['backend', 'new-tag']);
  });

  it('removes tags when --remove flag is used', async () => {
    const storage = getStorage();
    storage.setPort(4000, { port: 4000, label: 'db', status: 'open', tags: ['backend', 'db', 'legacy'] });

    const program = buildProgram();
    await program.parseAsync(['tag', '--remove', '4000', 'legacy'], { from: 'user' });

    const entry = storage.getPort(4000);
    expect(entry?.tags).toEqual(['backend', 'db']);
  });

  it('lists tags for a port with --list flag', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const storage = getStorage();
    storage.setPort(5000, { port: 5000, label: 'frontend', status: 'open', tags: ['ui', 'react'] });

    const program = buildProgram();
    await program.parseAsync(['tag', '--list', '5000', 'ignored'], { from: 'user' });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ui, react'));
    consoleSpy.mockRestore();
  });

  it('exits with error for invalid port', async () => {
    const program = buildProgram();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(
      program.parseAsync(['tag', 'notaport', 'sometag'], { from: 'user' })
    ).rejects.toThrow('exit');

    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  it('exits with error when port entry does not exist', async () => {
    const program = buildProgram();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(
      program.parseAsync(['tag', '9999', 'sometag'], { from: 'user' })
    ).rejects.toThrow('exit');

    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });
});
