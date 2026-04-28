import { Command } from 'commander';
import { registerAliasCommand } from '../alias';
import { getStorage, resetStorage } from '../../../storage/index';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerAliasCommand(program);
  return program;
}

const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(() => {
  resetStorage();
  consoleSpy.mockClear();
  errorSpy.mockClear();
});

afterAll(() => {
  consoleSpy.mockRestore();
  errorSpy.mockRestore();
});

describe('alias set', () => {
  it('sets an alias for a known port', () => {
    const storage = getStorage();
    storage.set(3000, { port: 3000, label: 'frontend', tags: [] });

    buildProgram().parse(['alias', 'set', '3000', 'fe'], { from: 'user' });

    expect(consoleSpy).toHaveBeenCalledWith('Alias "fe" set for port 3000.');
    expect(storage.get(3000)?.alias).toBe('fe');
  });

  it('errors on unknown port', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() =>
      buildProgram().parse(['alias', 'set', '9999', 'myalias'], { from: 'user' })
    ).toThrow();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No entry found'));
    exitSpy.mockRestore();
  });

  it('errors when alias contains spaces', () => {
    const storage = getStorage();
    storage.set(3000, { port: 3000, label: 'frontend', tags: [] });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() =>
      buildProgram().parse(['alias', 'set', '3000', 'my alias'], { from: 'user' })
    ).toThrow();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('no spaces'));
    exitSpy.mockRestore();
  });

  it('errors when alias already used by another port', () => {
    const storage = getStorage();
    storage.set(3000, { port: 3000, label: 'frontend', tags: [], alias: 'fe' });
    storage.set(4000, { port: 4000, label: 'backend', tags: [] });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() =>
      buildProgram().parse(['alias', 'set', '4000', 'fe'], { from: 'user' })
    ).toThrow();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('already used by port 3000'));
    exitSpy.mockRestore();
  });
});

describe('alias remove', () => {
  it('removes an existing alias', () => {
    const storage = getStorage();
    storage.set(3000, { port: 3000, label: 'frontend', tags: [], alias: 'fe' });

    buildProgram().parse(['alias', 'remove', '3000'], { from: 'user' });

    expect(storage.get(3000)?.alias).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith('Alias removed from port 3000.');
  });

  it('notifies when no alias present', () => {
    const storage = getStorage();
    storage.set(3000, { port: 3000, label: 'frontend', tags: [] });

    buildProgram().parse(['alias', 'remove', '3000'], { from: 'user' });

    expect(consoleSpy).toHaveBeenCalledWith('Port 3000 has no alias to remove.');
  });
});

describe('alias list', () => {
  it('lists aliased ports', () => {
    const storage = getStorage();
    storage.set(3000, { port: 3000, label: 'frontend', tags: [], alias: 'fe' });
    storage.set(4000, { port: 4000, label: 'backend', tags: [] });

    buildProgram().parse(['alias', 'list'], { from: 'user' });

    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('fe');
    expect(output).not.toContain('4000');
  });

  it('prints message when no aliases exist', () => {
    buildProgram().parse(['alias', 'list'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith('No aliases defined.');
  });
});
