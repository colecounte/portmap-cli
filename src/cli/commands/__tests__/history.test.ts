import { Command } from 'commander';
import { registerHistoryCommand } from '../history';
import * as storage from '../../../storage';
import * as reportFormatter from '../../../reporter/reportFormatter';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerHistoryCommand(program);
  return program;
}

const mockHistory = [
  { port: 3000, label: 'frontend', status: 'open', scannedAt: Date.now() - 10000 },
  { port: 5432, label: 'postgres', status: 'open', scannedAt: Date.now() - 5000 },
  { port: 8080, label: '', status: 'closed', scannedAt: Date.now() },
];

const mockStorage = {
  getHistory: jest.fn().mockResolvedValue(mockHistory),
  clearHistory: jest.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(storage, 'getStorage').mockResolvedValue(mockStorage as any);
  jest.spyOn(reportFormatter, 'formatTable').mockReturnValue('table output');
  jest.spyOn(reportFormatter, 'formatJson').mockReturnValue('{"data":[]}');
  jest.spyOn(reportFormatter, 'formatCsv').mockReturnValue('csv output');
});

describe('history command', () => {
  it('displays history in table format by default', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'history']);
    expect(storage.getStorage).toHaveBeenCalled();
    expect(reportFormatter.formatTable).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('table output');
    consoleSpy.mockRestore();
  });

  it('displays history in json format when --format json', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'history', '--format', 'json']);
    expect(reportFormatter.formatJson).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('filters by port when --port is provided', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'history', '--port', '3000']);
    const callArg = (reportFormatter.formatTable as jest.Mock).mock.calls[0][0];
    expect(callArg.every((r: any) => r.port === 3000)).toBe(true);
    consoleSpy.mockRestore();
  });

  it('clears history when --clear flag is set', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'history', '--clear']);
    expect(mockStorage.clearHistory).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('History cleared.');
    consoleSpy.mockRestore();
  });

  it('shows message when no history entries found', async () => {
    mockStorage.getHistory.mockResolvedValueOnce([]);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'history']);
    expect(consoleSpy).toHaveBeenCalledWith('No history entries found.');
    consoleSpy.mockRestore();
  });
});
