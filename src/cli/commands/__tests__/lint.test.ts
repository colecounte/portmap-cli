import { Command } from 'commander';
import { lintPortmap, LintIssue } from '../lint';
import * as storage from '../../../storage';

jest.mock('../../../storage');

const mockGetStorage = storage.getStorage as jest.Mock;

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  const { registerLintCommand } = require('../lint');
  registerLintCommand(program);
  return program;
}

describe('lintPortmap()', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns no issues for a clean portmap', () => {
    mockGetStorage.mockReturnValue({
      ports: {
        3000: { label: 'api-server', note: 'Main API' },
        4000: { label: 'frontend', note: '' },
      },
    });
    const issues = lintPortmap();
    expect(issues).toHaveLength(0);
  });

  it('warns when a port has no label', () => {
    mockGetStorage.mockReturnValue({ ports: { 3000: { label: '' } } });
    const issues = lintPortmap();
    expect(issues.some((i) => i.port === 3000 && i.message.includes('no label'))).toBe(true);
  });

  it('errors on duplicate labels (case-insensitive)', () => {
    mockGetStorage.mockReturnValue({
      ports: {
        3000: { label: 'API' },
        4000: { label: 'api' },
      },
    });
    const issues = lintPortmap();
    const dupIssue = issues.find((i) => i.severity === 'error' && i.message.includes('Duplicate'));
    expect(dupIssue).toBeDefined();
    expect(dupIssue?.port).toBe(4000);
  });

  it('warns for privileged ports', () => {
    mockGetStorage.mockReturnValue({ ports: { 80: { label: 'http' } } });
    const issues = lintPortmap();
    expect(issues.some((i) => i.port === 80 && i.message.includes('privileged'))).toBe(true);
  });

  it('errors for out-of-range port', () => {
    mockGetStorage.mockReturnValue({ ports: { 99999: { label: 'bad' } } });
    const issues = lintPortmap();
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('65535'))).toBe(true);
  });

  it('warns when note exceeds 200 characters', () => {
    const longNote = 'x'.repeat(201);
    mockGetStorage.mockReturnValue({ ports: { 3000: { label: 'api', note: longNote } } });
    const issues = lintPortmap();
    expect(issues.some((i) => i.message.includes('200 characters'))).toBe(true);
  });

  it('returns empty array when no ports are stored', () => {
    mockGetStorage.mockReturnValue({ ports: {} });
    expect(lintPortmap()).toEqual([]);
  });
});

describe('lint command', () => {
  afterEach(() => jest.clearAllMocks());

  it('prints success message when no issues', () => {
    mockGetStorage.mockReturnValue({ ports: { 3000: { label: 'ok' } } });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    program.parse(['lint'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No issues'));
    spy.mockRestore();
  });

  it('filters to errors only with --errors-only flag', () => {
    mockGetStorage.mockReturnValue({ ports: { 80: { label: 'http' } } });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    program.parse(['lint', '--errors-only'], { from: 'user' });
    // Privileged port is a warning — should not appear
    const calls = spy.mock.calls.flat().join(' ');
    expect(calls).toContain('No issues');
    spy.mockRestore();
  });
});
