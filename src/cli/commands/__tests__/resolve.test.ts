import { Command } from 'commander';
import { resolvePort, registerResolveCommand } from '../resolve';
import { getStorage, resetStorage } from '../../../storage/index';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerResolveCommand(program);
  return program;
}

describe('resolvePort()', () => {
  beforeEach(() => {
    resetStorage();
    const storage = getStorage();
    storage.save({
      3000: { label: 'frontend', alias: 'fe' },
      4000: { label: 'backend' },
      5432: { label: 'postgres', alias: 'db' },
    });
  });

  it('resolves by port number', () => {
    const result = resolvePort('3000');
    expect(result.matched).toBe(true);
    expect(result.port).toBe(3000);
    expect(result.label).toBe('frontend');
  });

  it('resolves by label (case-insensitive)', () => {
    const result = resolvePort('Backend');
    expect(result.matched).toBe(true);
    expect(result.port).toBe(4000);
    expect(result.label).toBe('backend');
  });

  it('resolves by alias (case-insensitive)', () => {
    const result = resolvePort('DB');
    expect(result.matched).toBe(true);
    expect(result.port).toBe(5432);
    expect(result.alias).toBe('db');
  });

  it('returns matched: false for unknown label', () => {
    const result = resolvePort('unknown');
    expect(result.matched).toBe(false);
  });

  it('returns matched: false for unknown port number', () => {
    const result = resolvePort('9999');
    expect(result.matched).toBe(false);
    expect(result.port).toBe(9999);
  });
});

describe('resolve command', () => {
  let program: Command;
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    resetStorage();
    const storage = getStorage();
    storage.save({
      3000: { label: 'frontend', alias: 'fe' },
    });
    program = buildProgram();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('prints port info by label', async () => {
    await program.parseAsync(['node', 'test', 'resolve', 'frontend']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('3000'));
  });

  it('prints JSON output with --json flag', async () => {
    await program.parseAsync(['node', 'test', 'resolve', 'fe', '--json']);
    const output = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.port).toBe(3000);
    expect(parsed.matched).toBe(true);
  });

  it('exits with error for unresolved query', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      program.parseAsync(['node', 'test', 'resolve', 'notfound'])
    ).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
