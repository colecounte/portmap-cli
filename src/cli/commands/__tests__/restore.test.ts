import { Command } from 'commander';
import { restoreSnapshot, registerRestoreCommand } from '../restore';
import { getStorage, resetStorage } from '../../../storage/index';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerRestoreCommand(program);
  return program;
}

describe('restoreSnapshot()', () => {
  beforeEach(() => resetStorage());

  it('restores entries not already present', () => {
    const snapshot = {
      '3000': { label: 'web', tags: [], note: '' },
      '4000': { label: 'api', tags: [], note: '' },
    };
    const result = restoreSnapshot(snapshot as any, false);
    expect(result.restored).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.overwritten).toBe(0);
  });

  it('skips existing entries when overwrite is false', () => {
    const storage = getStorage();
    storage.set(3000, { label: 'existing', tags: [], note: '' } as any);
    const snapshot = { '3000': { label: 'new', tags: [], note: '' } };
    const result = restoreSnapshot(snapshot as any, false);
    expect(result.skipped).toBe(1);
    expect(result.restored).toBe(0);
  });

  it('overwrites existing entries when overwrite is true', () => {
    const storage = getStorage();
    storage.set(3000, { label: 'old', tags: [], note: '' } as any);
    const snapshot = { '3000': { label: 'new', tags: [], note: '' } };
    const result = restoreSnapshot(snapshot as any, true);
    expect(result.overwritten).toBe(1);
    expect(result.skipped).toBe(0);
  });
});

describe('restore command', () => {
  beforeEach(() => {
    resetStorage();
    jest.clearAllMocks();
  });

  it('exits with error if file does not exist', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    const program = buildProgram();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => program.parse(['node', 'test', 'restore', 'missing.json'])).toThrow('exit');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    exitSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('exits with error if file is invalid JSON', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('not-json');
    const program = buildProgram();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => program.parse(['node', 'test', 'restore', 'bad.json'])).toThrow('exit');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to parse'));
    exitSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('prints dry-run summary without applying changes', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ '5000': { label: 'test', tags: [], note: '' } }));
    const program = buildProgram();
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    program.parse(['node', 'test', 'restore', 'snap.json', '--dry-run']);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Dry run'));
    const storage = getStorage();
    expect(storage.load()[5000]).toBeUndefined();
    logSpy.mockRestore();
  });

  it('restores entries and prints summary', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ '6000': { label: 'svc', tags: [], note: '' } }));
    const program = buildProgram();
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    program.parse(['node', 'test', 'restore', 'snap.json']);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Restore complete'));
    logSpy.mockRestore();
  });
});
