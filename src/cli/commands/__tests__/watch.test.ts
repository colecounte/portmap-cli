import { Command } from 'commander';
import { registerWatchCommand, runWatch } from '../watch';
import * as portScanner from '../../../scanner/portScanner';
import * as storageIndex from '../../../storage/index';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerWatchCommand(program);
  return program;
}

describe('registerWatchCommand', () => {
  it('registers the watch command', () => {
    const program = buildProgram();
    const cmd = program.commands.find((c) => c.name() === 'watch');
    expect(cmd).toBeDefined();
  });

  it('watch command has expected options', () => {
    const program = buildProgram();
    const cmd = program.commands.find((c) => c.name() === 'watch')!;
    const optNames = cmd.options.map((o) => o.long);
    expect(optNames).toContain('--ports');
    expect(optNames).toContain('--interval');
    expect(optNames).toContain('--verbose');
  });
});

describe('runWatch', () => {
  let checkPortMock: jest.SpyInstance;
  let loadMock: jest.Mock;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    checkPortMock = jest.spyOn(portScanner, 'checkPort').mockResolvedValue(false);
    loadMock = jest.fn().mockReturnValue([]);
    jest.spyOn(storageIndex, 'getStorage').mockReturnValue({ load: loadMock } as any);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('logs initial state when verbose is true', async () => {
    checkPortMock.mockResolvedValue(true);
    await runWatch([3000], 5000, true);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('OPEN'));
  });

  it('does not log initial state when verbose is false', async () => {
    checkPortMock.mockResolvedValue(false);
    await runWatch([3000], 5000, false);
    const initLogs = consoleSpy.mock.calls.filter((c) => c[0]?.includes('[init]'));
    expect(initLogs).toHaveLength(0);
  });

  it('detects port opening on second tick', async () => {
    checkPortMock.mockResolvedValueOnce(false).mockResolvedValue(true);
    await runWatch([8080], 1000, false);
    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[+] port 8080 is now OPEN'));
  });

  it('detects port closing on second tick', async () => {
    checkPortMock.mockResolvedValueOnce(true).mockResolvedValue(false);
    await runWatch([9000], 1000, false);
    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[-] port 9000 is now CLOSED'));
  });

  it('uses label in output when available', async () => {
    checkPortMock.mockResolvedValue(true);
    loadMock.mockReturnValue([{ port: 3000, label: 'frontend', addedAt: '' }]);
    await runWatch([3000], 5000, true);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('frontend'));
  });
});
