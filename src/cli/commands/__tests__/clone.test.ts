import { Command } from 'commander';
import { clonePortmap, registerCloneCommand } from '../clone';
import { getStorage, resetStorage } from '../../../storage/index';

jest.mock('../../../storage/index');

const mockLoad = jest.fn();
const mockSave = jest.fn();

(getStorage as jest.Mock).mockReturnValue({
  load: mockLoad,
  save: mockSave,
});

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerCloneCommand(program);
  return program;
}

describe('clonePortmap()', () => {
  const basePortmap = {
    '3000': { label: 'api-server', addedAt: '2024-01-01T00:00:00.000Z' },
    '3001': { label: 'api-worker', addedAt: '2024-01-01T00:00:00.000Z' },
    '4000': { label: 'web-frontend', addedAt: '2024-01-01T00:00:00.000Z' },
  };

  it('clones entries matching the source prefix', () => {
    const { cloned, skipped, result } = clonePortmap('api', 'api-v2', basePortmap);
    expect(cloned).toBe(2);
    expect(skipped).toBe(0);
    expect(result['13000'].label).toBe('api-v2-server');
    expect(result['13001'].label).toBe('api-v2-worker');
  });

  it('skips entries whose target label already exists', () => {
    const portmapWithConflict = {
      ...basePortmap,
      '13000': { label: 'api-v2-server', addedAt: '2024-01-01T00:00:00.000Z' },
    };
    const { cloned, skipped } = clonePortmap('api', 'api-v2', portmapWithConflict);
    expect(skipped).toBeGreaterThanOrEqual(1);
    expect(cloned).toBe(1);
  });

  it('returns 0 cloned when no entries match prefix', () => {
    const { cloned } = clonePortmap('nonexistent', 'other', basePortmap);
    expect(cloned).toBe(0);
  });

  it('sets note referencing the original port', () => {
    const { result } = clonePortmap('api', 'api-v2', basePortmap);
    expect(result['13000'].note).toMatch(/Cloned from port 3000/);
  });

  it('does not modify entries that do not match prefix', () => {
    const { result } = clonePortmap('api', 'api-v2', basePortmap);
    expect(result['4000'].label).toBe('web-frontend');
  });
});

describe('clone command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStorage();
    mockLoad.mockResolvedValue({
      '3000': { label: 'svc-alpha', addedAt: '2024-01-01T00:00:00.000Z' },
    });
    mockSave.mockResolvedValue(undefined);
  });

  it('saves cloned entries to storage', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'clone', 'svc', 'svc-copy']);
    expect(mockSave).toHaveBeenCalledTimes(1);
    const saved = mockSave.mock.calls[0][0];
    expect(saved['13000'].label).toBe('svc-copy-alpha');
  });

  it('does not save in dry-run mode', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'clone', 'svc', 'svc-copy', '--dry-run']);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('prints message when no matching entries found', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'clone', 'nomatch', 'other']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No entries found'));
    consoleSpy.mockRestore();
  });
});
