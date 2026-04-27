import { Command } from 'commander';
import { registerNoteCommand } from '../note';
import { getStorage } from '../../../storage/index';

jest.mock('../../../storage/index');

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerNoteCommand(program);
  return program;
}

const mockSave = jest.fn().mockResolvedValue(undefined);

const mockStorage = {
  ports: {
    3000: { port: 3000, label: 'frontend', note: 'Main UI server' },
    4000: { port: 4000, label: 'api' },
  },
  save: mockSave,
};

beforeEach(() => {
  jest.clearAllMocks();
  (getStorage as jest.Mock).mockResolvedValue(mockStorage);
  mockStorage.ports[3000].note = 'Main UI server';
  delete (mockStorage.ports[4000] as any).note;
});

describe('note command', () => {
  it('displays existing note for a port', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await buildProgram().parseAsync(['node', 'test', 'note', '3000']);
    expect(consoleSpy).toHaveBeenCalledWith('Port 3000 note: Main UI server');
    consoleSpy.mockRestore();
  });

  it('displays message when no note is set', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await buildProgram().parseAsync(['node', 'test', 'note', '4000']);
    expect(consoleSpy).toHaveBeenCalledWith('No note set for port 4000.');
    consoleSpy.mockRestore();
  });

  it('saves a new note for a port', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await buildProgram().parseAsync(['node', 'test', 'note', '4000', 'Background worker']);
    expect(mockStorage.ports[4000].note).toBe('Background worker');
    expect(mockSave).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Note saved for port 4000: "Background worker"');
    consoleSpy.mockRestore();
  });

  it('deletes a note with --delete flag', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await buildProgram().parseAsync(['node', 'test', 'note', '3000', '--delete']);
    expect(mockStorage.ports[3000].note).toBeUndefined();
    expect(mockSave).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Note removed from port 3000.');
    consoleSpy.mockRestore();
  });

  it('exits with error for invalid port', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(buildProgram().parseAsync(['node', 'test', 'note', 'abc'])).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith('Invalid port number: abc');
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('exits with error when port entry not found', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(buildProgram().parseAsync(['node', 'test', 'note', '9999'])).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith("No entry found for port 9999. Run 'scan' first.");
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
