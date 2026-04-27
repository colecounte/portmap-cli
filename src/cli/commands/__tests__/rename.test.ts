import { Command } from 'commander';
import { registerRenameCommand } from '../rename';
import { getStorage, resetStorage } from '../../../storage/index';

jest.mock('../../../storage/index');

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerRenameCommand(program);
  return program;
}

describe('rename command', () => {
  const mockSave = jest.fn().mockResolvedValue(undefined);
  const mockGet = jest.fn();
  const mockSet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (getStorage as jest.Mock).mockResolvedValue({
      get: mockGet,
      set: mockSet,
      save: mockSave,
    });
  });

  it('renames the label for a tracked port', async () => {
    mockGet.mockReturnValue({ port: 3000, label: 'old-label', updatedAt: '' });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await buildProgram().parseAsync(['rename', '3000', 'new-label'], { from: 'user' });

    expect(mockSet).toHaveBeenCalledWith(3000, expect.objectContaining({ label: 'new-label' }));
    expect(mockSave).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('new-label'));
    consoleSpy.mockRestore();
  });

  it('outputs JSON when --json flag is provided', async () => {
    mockGet.mockReturnValue({ port: 4000, label: 'api', updatedAt: '' });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await buildProgram().parseAsync(['rename', '4000', 'api-v2', '--json'], { from: 'user' });

    const output = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(output.port).toBe(4000);
    expect(output.newLabel).toBe('api-v2');
    expect(output.oldLabel).toBe('api');
    consoleSpy.mockRestore();
  });

  it('exits with error for untracked port', async () => {
    mockGet.mockReturnValue(undefined);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(
      buildProgram().parseAsync(['rename', '9999', 'ghost'], { from: 'user' })
    ).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('not currently tracked'));
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('exits with error for invalid port number', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(
      buildProgram().parseAsync(['rename', 'abc', 'label'], { from: 'user' })
    ).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('not a valid port number'));
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
