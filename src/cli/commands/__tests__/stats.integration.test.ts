import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { registerStatsCommand } from '../stats';
import * as storageModule from '../../../storage/index';
import * as historyStore from '../../../storage/historyStore';

jest.mock('../../../storage/index');
jest.mock('../../../storage/historyStore');

const mockGetStorage = storageModule.getStorage as jest.MockedFunction<typeof storageModule.getStorage>;
const mockGetHistoryForPort = historyStore.getHistoryForPort as jest.MockedFunction<typeof historyStore.getHistoryForPort>;

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerStatsCommand(program);
  return program;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetHistoryForPort.mockResolvedValue([]);
});

describe('stats integration', () => {
  it('handles empty storage gracefully', async () => {
    mockGetStorage.mockResolvedValue({} as any);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'stats']);
    const output = consoleSpy.mock.calls.flat().join('\n');
    expect(output).toContain('Total tracked ports : 0');
    consoleSpy.mockRestore();
  });

  it('omits top-tags section when no tags exist', async () => {
    mockGetStorage.mockResolvedValue({
      8080: { label: 'proxy', tags: [], note: '' },
    } as any);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'stats']);
    const output = consoleSpy.mock.calls.flat().join('\n');
    expect(output).not.toContain('Top tags');
    consoleSpy.mockRestore();
  });

  it('omits most-active section when no history exists', async () => {
    mockGetStorage.mockResolvedValue({
      9000: { label: 'service', tags: [], note: '' },
    } as any);
    mockGetHistoryForPort.mockResolvedValue([]);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'stats']);
    const output = consoleSpy.mock.calls.flat().join('\n');
    expect(output).not.toContain('Most active');
    consoleSpy.mockRestore();
  });
});
