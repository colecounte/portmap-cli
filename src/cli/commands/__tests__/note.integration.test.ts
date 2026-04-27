import { Command } from 'commander';
import { registerNoteCommand } from '../note';
import { getStorage, resetStorage } from '../../../storage/index';

jest.mock('../../../storage/index');

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerNoteCommand(program);
  return program;
}

describe('note command integration', () => {
  const mockSave = jest.fn().mockResolvedValue(undefined);
  const ports: Record<number, any> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(ports).forEach(k => delete ports[Number(k)]);
    ports[8080] = { port: 8080, label: 'proxy' };
    ports[5432] = { port: 5432, label: 'postgres', note: 'Dev DB' };
    (getStorage as jest.Mock).mockResolvedValue({ ports, save: mockSave });
  });

  it('round-trips: set then view a note', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();

    await buildProgram().parseAsync(['node', 'test', 'note', '8080', 'Reverse proxy']);
    expect(ports[8080].note).toBe('Reverse proxy');

    await buildProgram().parseAsync(['node', 'test', 'note', '8080']);
    expect(logSpy).toHaveBeenLastCalledWith('Port 8080 note: Reverse proxy');

    logSpy.mockRestore();
  });

  it('round-trips: set then delete a note', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();

    await buildProgram().parseAsync(['node', 'test', 'note', '5432', '--delete']);
    expect(ports[5432].note).toBeUndefined();

    await buildProgram().parseAsync(['node', 'test', 'note', '5432']);
    expect(logSpy).toHaveBeenLastCalledWith('No note set for port 5432.');

    logSpy.mockRestore();
  });

  it('overwrites an existing note', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();

    await buildProgram().parseAsync(['node', 'test', 'note', '5432', 'Staging DB']);
    expect(ports[5432].note).toBe('Staging DB');
    expect(mockSave).toHaveBeenCalledTimes(1);

    logSpy.mockRestore();
  });
});
