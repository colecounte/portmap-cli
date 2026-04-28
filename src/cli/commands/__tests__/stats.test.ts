import { Command } from 'commander';
import { computeStats, registerStatsCommand } from '../stats';
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

const sampleStorage = {
  3000: { label: 'frontend', tags: ['web', 'react'], note: 'Main app' },
  4000: { label: 'backend', tags: ['api'], note: '' },
  5000: { label: '', tags: [], note: '' },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetStorage.mockResolvedValue(sampleStorage as any);
  mockGetHistoryForPort.mockImplementation(async (port: number) => {
    if (port === 3000) return [{ event: 'open' }, { event: 'close' }] as any;
    if (port === 4000) return [{ event: 'open' }] as any;
    return [];
  });
});

describe('computeStats', () => {
  it('counts total ports correctly', async () => {
    const stats = await computeStats();
    expect(stats.totalPorts).toBe(3);
  });

  it('counts labeled ports', async () => {
    const stats = await computeStats();
    expect(stats.labeledPorts).toBe(2);
  });

  it('counts tagged ports', async () => {
    const stats = await computeStats();
    expect(stats.taggedPorts).toBe(2);
  });

  it('counts ports with notes', async () => {
    const stats = await computeStats();
    expect(stats.notedPorts).toBe(1);
  });

  it('returns top tags sorted by count', async () => {
    const stats = await computeStats();
    expect(stats.topTags[0].tag).toBeDefined();
    expect(stats.topTags.length).toBeLessThanOrEqual(5);
  });

  it('returns most active ports sorted by event count', async () => {
    const stats = await computeStats();
    expect(stats.mostActive[0].port).toBe(3000);
    expect(stats.mostActive[0].events).toBe(2);
  });
});

describe('stats command', () => {
  it('runs without error and prints output', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'stats']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Statistics'));
    consoleSpy.mockRestore();
  });

  it('displays top tags when present', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'stats']);
    const calls = consoleSpy.mock.calls.flat().join(' ');
    expect(calls).toContain('#web');
    consoleSpy.mockRestore();
  });
});
