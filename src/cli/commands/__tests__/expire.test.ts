import { Command } from 'commander';
import { getExpiredPorts, registerExpireCommand } from '../expire';
import { getStorage, resetStorage } from '../../../storage/index';

jest.mock('../../../storage/index');

const mockGetAll = jest.fn();
const mockRemove = jest.fn();
const mockSave = jest.fn();

(getStorage as jest.Mock).mockResolvedValue({
  getAll: mockGetAll,
  remove: mockRemove,
  save: mockSave,
});

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerExpireCommand(program);
  return program;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const now = Date.now();

const mockData = {
  '3000': { label: 'frontend', lastSeen: new Date(now - 10 * DAY_MS).toISOString() },
  '4000': { label: 'backend', lastSeen: new Date(now - 1 * DAY_MS).toISOString() },
  '5000': { label: 'db', lastSeen: new Date(now - 20 * DAY_MS).toISOString(), pinned: true },
  '6000': { label: 'cache', lastSeen: new Date(now - 8 * DAY_MS).toISOString() },
  '7000': {},
};

describe('getExpiredPorts', () => {
  it('returns ports older than threshold', () => {
    const expired = getExpiredPorts(mockData as any, 7 * DAY_MS);
    expect(expired).toContain('3000');
    expect(expired).toContain('6000');
    expect(expired).not.toContain('4000');
  });

  it('excludes pinned ports', () => {
    const expired = getExpiredPorts(mockData as any, 7 * DAY_MS);
    expect(expired).not.toContain('5000');
  });

  it('excludes ports without lastSeen', () => {
    const expired = getExpiredPorts(mockData as any, 7 * DAY_MS);
    expect(expired).not.toContain('7000');
  });

  it('respects custom threshold in hours', () => {
    const expired = getExpiredPorts(mockData as any, 12 * 60 * 60 * 1000);
    expect(expired).toContain('3000');
    expect(expired).toContain('4000');
  });
});

describe('expire command', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockGetAll.mockReturnValue(mockData);
    mockRemove.mockClear();
    mockSave.mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('lists expired ports without --remove', async () => {
    const program = buildProgram();
    await program.parseAsync(['expire'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Expired ports'));
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('removes expired ports when --remove is passed', async () => {
    const program = buildProgram();
    await program.parseAsync(['expire', '--remove'], { from: 'user' });
    expect(mockRemove).toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalled();
  });

  it('shows no expired message when all ports are fresh', async () => {
    mockGetAll.mockReturnValue({
      '3000': { label: 'fresh', lastSeen: new Date(now - 1 * DAY_MS).toISOString() },
    });
    const program = buildProgram();
    await program.parseAsync(['expire', '--days', '7'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith('No expired port entries found.');
  });
});
