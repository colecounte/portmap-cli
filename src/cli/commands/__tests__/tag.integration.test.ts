import { Command } from 'commander';
import { registerTagCommand } from '../tag';
import { getStorage, resetStorage } from '../../../storage/index';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerTagCommand(program);
  return program;
}

describe('tag command integration', () => {
  beforeEach(() => {
    resetStorage();
  });

  it('supports full add-then-remove tag lifecycle', async () => {
    const storage = getStorage();
    storage.setPort(8080, { port: 8080, label: 'proxy', status: 'open', tags: [] });

    const program = buildProgram();

    await program.parseAsync(['tag', '8080', 'proxy', 'infra', 'temp'], { from: 'user' });
    let entry = storage.getPort(8080);
    expect(entry?.tags).toEqual(['proxy', 'infra', 'temp']);

    const program2 = buildProgram();
    await program2.parseAsync(['tag', '--remove', '8080', 'temp'], { from: 'user' });
    entry = storage.getPort(8080);
    expect(entry?.tags).toEqual(['proxy', 'infra']);
  });

  it('shows empty tag message when no tags are set', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const storage = getStorage();
    storage.setPort(7070, { port: 7070, label: 'metrics', status: 'open', tags: [] });

    const program = buildProgram();
    await program.parseAsync(['tag', '--list', '7070', 'ignored'], { from: 'user' });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('no tags'));
    consoleSpy.mockRestore();
  });

  it('handles removing a tag that does not exist gracefully', async () => {
    const storage = getStorage();
    storage.setPort(6060, { port: 6060, label: 'worker', status: 'open', tags: ['active'] });

    const program = buildProgram();
    await program.parseAsync(['tag', '--remove', '6060', 'nonexistent'], { from: 'user' });

    const entry = storage.getPort(6060);
    expect(entry?.tags).toEqual(['active']);
  });
});
